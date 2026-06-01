using System.Text;
using System.Text.Json;
using BlazorJsonVisualizer.Protocol;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class PreparedDocumentRuntimeBridge(IPreparedJsonDocumentStore store) : IPreparedDocumentRuntimeBridge
{
    private const int MaxTextRangeBytes = 4096;
    private const int MaxRowCount = 200;
    private const int MaxSearchResults = 100;
    private static readonly UTF8Encoding StrictUtf8 = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: true);
    private readonly Lock gate = new();
    private readonly Dictionary<string, PreparedRuntimeSession> sessions = [];

    public async ValueTask<PreparedOpenResultDto> OpenAsync(PreparedOpenRequestDto request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(request.SessionId))
        {
            return new PreparedOpenResultDto(false, request.SessionId, request.DocumentId, Diagnostics: [CreateDiagnostic("prepared.invalidSession", "SessionId is required.")]);
        }

        if (string.IsNullOrWhiteSpace(request.DocumentId))
        {
            return new PreparedOpenResultDto(false, request.SessionId, request.DocumentId, Diagnostics: [CreateDiagnostic("prepared.invalidDocument", "DocumentId is required.")]);
        }

        PreparedRuntimeSession? existingSession = null;
        lock (gate)
        {
            sessions.Remove(request.SessionId, out existingSession);
        }

        if (existingSession is not null)
        {
            await existingSession.DisposeAsync();
        }

        var info = await store.GetAsync(request.DocumentId, cancellationToken);
        if (info is null)
        {
            return new PreparedOpenResultDto(false, request.SessionId, request.DocumentId, Diagnostics: [CreateDiagnostic("prepared.documentNotFound", $"Prepared document '{request.DocumentId}' was not found.")]);
        }

        if (info.State != JsonDocumentPreparationState.Ready)
        {
            return new PreparedOpenResultDto(false, request.SessionId, request.DocumentId, Diagnostics: [CreateDiagnostic("prepared.documentNotReady", $"Prepared document '{request.DocumentId}' is in state '{info.State}'.")]);
        }

        try
        {
            var handle = await store.OpenAsync(request.DocumentId, cancellationToken);
            var runtimeSession = await PreparedRuntimeSession.CreateAsync(request.SessionId, handle, cancellationToken);
            lock (gate)
            {
                sessions.Add(request.SessionId, runtimeSession);
            }

            return new PreparedOpenResultDto(true, request.SessionId, request.DocumentId, runtimeSession.Metadata.Revision, runtimeSession.Metadata, runtimeSession.Diagnostics);
        }
        catch (Exception exception) when (exception is InvalidDataException or JsonException or DecoderFallbackException)
        {
            return new PreparedOpenResultDto(false, request.SessionId, request.DocumentId, Diagnostics: [CreateDiagnostic("prepared.decodeFailed", exception.Message)]);
        }
        catch (Exception exception)
        {
            return new PreparedOpenResultDto(false, request.SessionId, request.DocumentId, Diagnostics: [CreateDiagnostic("prepared.storageFailure", exception.Message)]);
        }
    }

    public ValueTask<PreparedDocumentMetadataDto> GetMetadataAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return ValueTask.FromResult(GetRequiredSession(sessionId).Metadata);
    }

    public async ValueTask<PreparedTextRangeDto> ReadTextRangeAsync(PreparedTextRangeRequestDto request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryGetSession(request.SessionId, out var session))
        {
            return CreateMissingSessionTextRange(request);
        }

        if (request.StartByteOffset < 0)
        {
            return CreateRangeFailure(session, request, "prepared.rangeOutOfBounds", "Requested start byte offset must be non-negative.");
        }

        if (request.StartByteOffset > session.Metadata.SourceByteLength)
        {
            return CreateRangeFailure(session, request, "prepared.rangeOutOfBounds", "Requested start byte offset is beyond the source length.");
        }

        var requestedLength = Math.Max(0, request.MaxByteLength);
        var boundedLength = (int)Math.Min(Math.Min(requestedLength, MaxTextRangeBytes), session.Metadata.SourceByteLength - request.StartByteOffset);
        var truncated = requestedLength > boundedLength;

        await using var range = await session.Handle.OpenSourceRangeAsync(request.StartByteOffset, boundedLength, cancellationToken);
        using var buffer = new MemoryStream();
        await range.CopyToAsync(buffer, cancellationToken);
        var bytes = buffer.ToArray();
        var text = StrictUtf8.GetString(bytes);

        return new PreparedTextRangeDto(
            request.SessionId,
            session.Metadata.DocumentId,
            session.Metadata.Revision,
            request.StartByteOffset,
            request.StartByteOffset,
            request.StartByteOffset + bytes.Length,
            text,
            truncated,
            []);
    }

    public ValueTask<PreparedRowsResultDto> GetRowsAsync(PreparedRowsRequestDto request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryGetSession(request.SessionId, out var session))
        {
            return ValueTask.FromResult(new PreparedRowsResultDto(request.SessionId, string.Empty, 0, request.FirstRow, request.RowCount, 0, [], [CreateDiagnostic("prepared.sessionNotFound", $"Prepared runtime session '{request.SessionId}' was not found.")]));
        }

        if (!session.IsStructureAvailable)
        {
            return ValueTask.FromResult(CreateRowsUnavailable(session, request, session.GetIndexDiagnostic("structure")));
        }

        var boundedFirstRow = Math.Max(0, request.FirstRow);
        var boundedRowCount = Math.Clamp(request.RowCount, 0, MaxRowCount);
        var visibleRows = session.GetVisibleRows();
        var rows = visibleRows.Skip(boundedFirstRow).Take(boundedRowCount).ToArray();
        return ValueTask.FromResult(new PreparedRowsResultDto(request.SessionId, session.Metadata.DocumentId, session.Metadata.Revision, boundedFirstRow, boundedRowCount, visibleRows.Count, rows, session.Diagnostics));
    }

    public ValueTask<PreparedFoldStateResultDto> SetFoldStateAsync(PreparedFoldStateRequestDto request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryGetSession(request.SessionId, out var session))
        {
            return ValueTask.FromResult(new PreparedFoldStateResultDto(false, 0, [CreateDiagnostic("prepared.sessionNotFound", $"Prepared runtime session '{request.SessionId}' was not found.")]));
        }

        if (!session.IsStructureAvailable)
        {
            return ValueTask.FromResult(new PreparedFoldStateResultDto(false, session.FoldStateRevision, [session.GetIndexDiagnostic("structure")]));
        }

        if (!session.TrySetFoldState(request.NodeId, request.Folded))
        {
            return ValueTask.FromResult(new PreparedFoldStateResultDto(false, session.FoldStateRevision, [CreateDiagnostic("prepared.nodeNotFound", $"Prepared node '{request.NodeId}' was not found.")]));
        }

        return ValueTask.FromResult(new PreparedFoldStateResultDto(true, session.FoldStateRevision, []));
    }

    public async ValueTask<PreparedSearchResultPageDto> SearchAsync(PreparedSearchRequestDto request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryGetSession(request.SessionId, out var session))
        {
            return new PreparedSearchResultPageDto(request.SessionId, string.Empty, 0, [], Diagnostics: [CreateDiagnostic("prepared.sessionNotFound", $"Prepared runtime session '{request.SessionId}' was not found.")]);
        }

        if (!session.IsSearchAvailable)
        {
            return new PreparedSearchResultPageDto(request.SessionId, session.Metadata.DocumentId, session.Metadata.Revision, [], Diagnostics: [session.GetIndexDiagnostic("search")]);
        }

        if (!string.Equals(request.Scope, "allText", StringComparison.Ordinal))
        {
            return new PreparedSearchResultPageDto(request.SessionId, session.Metadata.DocumentId, session.Metadata.Revision, [], Diagnostics: [CreateDiagnostic("prepared.searchUnsupportedScope", $"Prepared search scope '{request.Scope}' is not supported.")]);
        }

        var boundedMaxResults = Math.Clamp(request.MaxResults, 0, MaxSearchResults);
        var searchLimit = boundedMaxResults == 0 ? 0 : boundedMaxResults + 1;
        var results = new List<PreparedSearchResultDto>();
        PreparedSearchResultDto? overflowResult = null;
        var ordinal = 0;
        try
        {
            await foreach (var result in session.Handle.SearchAsync(
                new PreparedDocumentSearchQuery(request.Query, request.IgnoreCase, PreparedDocumentSearchScope.AllText, searchLimit, request.ContinuationToken),
                cancellationToken))
            {
                var node = session.FindNodeContainingOffset(result.StartOffset);
                var dto = new PreparedSearchResultDto(
                    $"{result.StartOffset}:{result.EndOffset}:{ordinal++}",
                    result.Revision,
                    result.StartOffset,
                    result.EndOffset,
                    result.Preview,
                    node?.Path,
                    node?.NodeId);

                if (results.Count < boundedMaxResults)
                {
                    results.Add(dto);
                }
                else
                {
                    overflowResult = dto;
                    break;
                }
            }
        }
        catch (ArgumentException exception)
        {
            return new PreparedSearchResultPageDto(request.SessionId, session.Metadata.DocumentId, session.Metadata.Revision, [], Diagnostics: [CreateDiagnostic("prepared.invalidContinuationToken", exception.Message)]);
        }
        catch (NotSupportedException exception)
        {
            return new PreparedSearchResultPageDto(request.SessionId, session.Metadata.DocumentId, session.Metadata.Revision, [], Diagnostics: [CreateDiagnostic("prepared.searchUnsupportedScope", exception.Message)]);
        }

        session.RememberSearchResults(results);
        var continuationToken = overflowResult is null
            ? null
            : overflowResult.StartByteOffset.ToString(System.Globalization.CultureInfo.InvariantCulture);
        return new PreparedSearchResultPageDto(request.SessionId, session.Metadata.DocumentId, session.Metadata.Revision, results, continuationToken, []);
    }

    public ValueTask<PreparedRevealResultDto> RevealAsync(PreparedRevealRequestDto request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryGetSession(request.SessionId, out var session))
        {
            return ValueTask.FromResult(new PreparedRevealResultDto(false, request.SessionId, string.Empty, "sessionNotFound", Diagnostics: [CreateDiagnostic("prepared.sessionNotFound", $"Prepared runtime session '{request.SessionId}' was not found.")]));
        }

        if (!session.IsStructureAvailable)
        {
            return ValueTask.FromResult(new PreparedRevealResultDto(false, request.SessionId, session.Metadata.DocumentId, "notIndexed", Diagnostics: [session.GetIndexDiagnostic("structure")]));
        }

        var target = request.Target ?? new PreparedRevealTargetDto(string.Empty);
        var targetNode = ResolveRevealNode(session, target, out var targetLineIndex, out var failureResult);
        if (failureResult is not null)
        {
            return ValueTask.FromResult(failureResult);
        }

        var expandedNodeIds = targetNode is null
            ? Array.Empty<string>()
            : session.ExpandAncestors(targetNode.NodeId);
        var visibleRows = session.GetVisibleRows();
        var rowIndex = FindVisibleRowIndex(visibleRows, targetLineIndex, targetNode?.NodeId);
        var viewport = new PreparedViewportRequestDto(Math.Max(0, rowIndex - 5), 25);

        return ValueTask.FromResult(new PreparedRevealResultDto(
            true,
            request.SessionId,
            session.Metadata.DocumentId,
            RowIndex: rowIndex,
            NodeId: targetNode?.NodeId,
            Viewport: viewport,
            ExpandedNodeIds: expandedNodeIds,
            Diagnostics: []));
    }

    public async ValueTask<PreparedCloseResultDto> CloseAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        PreparedRuntimeSession? session = null;
        lock (gate)
        {
            if (sessions.Remove(sessionId, out var removed))
            {
                session = removed;
            }
        }

        if (session is null)
        {
            return new PreparedCloseResultDto(false, [CreateDiagnostic("prepared.sessionNotFound", $"Prepared runtime session '{sessionId}' was not found.")]);
        }

        await session.DisposeAsync();
        return new PreparedCloseResultDto(true, []);
    }

    private static int FindVisibleRowIndex(IReadOnlyList<PreparedRenderRowDto> rows, int targetLineIndex, string? targetNodeId)
    {
        for (var index = 0; index < rows.Count; index++)
        {
            var row = rows[index];
            if (targetNodeId is not null && string.Equals(row.NodeId, targetNodeId, StringComparison.Ordinal))
            {
                return index;
            }

            if (row.RowIndex == targetLineIndex)
            {
                return index;
            }
        }

        return Math.Clamp(targetLineIndex, 0, Math.Max(0, rows.Count - 1));
    }

    private PreparedRevealNode? ResolveRevealNode(
        PreparedRuntimeSession session,
        PreparedRevealTargetDto target,
        out int targetLineIndex,
        out PreparedRevealResultDto? failureResult)
    {
        failureResult = null;
        targetLineIndex = 0;

        switch (target.Kind)
        {
            case "jsonPointer":
                if (!session.IsPathRevealAvailable)
                {
                    failureResult = new PreparedRevealResultDto(false, session.SessionId, session.Metadata.DocumentId, "indexMissing", Diagnostics: [session.GetIndexDiagnostic("path")]);
                    return null;
                }

                if (string.IsNullOrWhiteSpace(target.Path) || !session.TryGetNodeByPath(target.Path, out var pathNode))
                {
                    failureResult = new PreparedRevealResultDto(false, session.SessionId, session.Metadata.DocumentId, "notFound", Diagnostics: [CreateDiagnostic("prepared.pathNotFound", $"Prepared JSON Pointer '{target.Path}' was not found.")]);
                    return null;
                }

                targetLineIndex = pathNode.StartLineIndex;
                return new PreparedRevealNode(pathNode.NodeId, pathNode.Path);

            case "searchResult":
                {
                    var offset = target.StartByteOffset ?? 0;
                    var node = session.ResolveSearchResultNode(target.ResultId, offset);
                    targetLineIndex = session.GetLineIndex(offset);
                    return node is null ? null : new PreparedRevealNode(node.NodeId, node.Path);
                }

            case "byteRange":
                {
                    var offset = target.StartByteOffset ?? -1;
                    if (offset < 0 || offset > session.Metadata.SourceByteLength)
                    {
                        failureResult = new PreparedRevealResultDto(false, session.SessionId, session.Metadata.DocumentId, "invalidTarget", Diagnostics: [CreateDiagnostic("prepared.invalidTarget", "Reveal byte range must specify a valid start byte offset.")]);
                        return null;
                    }

                    var node = session.FindNodeContainingOffset(offset);
                    targetLineIndex = session.GetLineIndex(offset);
                    return node is null ? null : new PreparedRevealNode(node.NodeId, node.Path);
                }

            case "node":
                if (string.IsNullOrWhiteSpace(target.NodeId) || !session.TryGetNode(target.NodeId, out var namedNode))
                {
                    failureResult = new PreparedRevealResultDto(false, session.SessionId, session.Metadata.DocumentId, "notFound", Diagnostics: [CreateDiagnostic("prepared.nodeNotFound", $"Prepared node '{target.NodeId}' was not found.")]);
                    return null;
                }

                targetLineIndex = namedNode.StartLineIndex;
                return new PreparedRevealNode(namedNode.NodeId, namedNode.Path);

            default:
                failureResult = new PreparedRevealResultDto(false, session.SessionId, session.Metadata.DocumentId, "unsupported", Diagnostics: [CreateDiagnostic("prepared.unsupportedReveal", $"Prepared reveal target '{target.Kind}' is not supported.")]);
                return null;
        }
    }

    private PreparedRuntimeSession GetRequiredSession(string sessionId)
        => TryGetSession(sessionId, out var session)
            ? session
            : throw new InvalidOperationException($"Prepared runtime session '{sessionId}' was not found.");

    private bool TryGetSession(string sessionId, out PreparedRuntimeSession session)
    {
        lock (gate)
        {
            return sessions.TryGetValue(sessionId, out session!);
        }
    }

    private static PreparedTextRangeDto CreateMissingSessionTextRange(PreparedTextRangeRequestDto request)
        => new(
            request.SessionId,
            string.Empty,
            0,
            request.StartByteOffset,
            request.StartByteOffset,
            request.StartByteOffset,
            string.Empty,
            false,
            [CreateDiagnostic("prepared.sessionNotFound", $"Prepared runtime session '{request.SessionId}' was not found.")]);

    private static PreparedTextRangeDto CreateRangeFailure(PreparedRuntimeSession session, PreparedTextRangeRequestDto request, string code, string message)
        => new(
            request.SessionId,
            session.Metadata.DocumentId,
            session.Metadata.Revision,
            request.StartByteOffset,
            request.StartByteOffset,
            request.StartByteOffset,
            string.Empty,
            false,
            [CreateDiagnostic(code, message)]);

    private static PreparedRowsResultDto CreateRowsUnavailable(PreparedRuntimeSession session, PreparedRowsRequestDto request, RuntimeDiagnosticDto diagnostic)
        => new(
            request.SessionId,
            session.Metadata.DocumentId,
            session.Metadata.Revision,
            request.FirstRow,
            request.RowCount,
            0,
            [],
            [diagnostic]);

    private static RuntimeDiagnosticDto CreateDiagnostic(string code, string message, long startOffset = 0, long endOffset = 0)
        => new(code, message, "error", ToDiagnosticOffset(startOffset), ToDiagnosticOffset(endOffset));

    private static int ToDiagnosticOffset(long offset)
        => offset switch
        {
            < 0 => 0,
            > int.MaxValue => int.MaxValue,
            _ => (int)offset
        };

    private sealed record PreparedRevealNode(string NodeId, string Path);

    private sealed class PreparedRuntimeSession : IAsyncDisposable
    {
        private readonly Dictionary<string, PreparedNodeRecord> nodesById;
        private readonly Dictionary<string, PreparedNodeRecord> nodesByPath;
        private readonly HashSet<string> foldedNodeIds = [];
        private readonly Dictionary<string, PreparedSearchResultDto> searchResultsById = [];
        private readonly string[] sourceLines;
        private readonly int[] lineDepths;

        private PreparedRuntimeSession(
            string sessionId,
            PreparedJsonDocumentHandle handle,
            PreparedDocumentMetadataDto metadata,
            IReadOnlyList<RuntimeDiagnosticDto> diagnostics,
            Dictionary<string, PreparedNodeRecord> nodesById,
            Dictionary<string, PreparedNodeRecord> nodesByPath,
            long[] lineStartOffsets,
            string[] sourceLines,
            int[] lineDepths)
        {
            SessionId = sessionId;
            Handle = handle;
            Metadata = metadata;
            Diagnostics = diagnostics;
            this.nodesById = nodesById;
            this.nodesByPath = nodesByPath;
            LineStartOffsets = lineStartOffsets;
            this.sourceLines = sourceLines;
            this.lineDepths = lineDepths;
        }

        public string SessionId { get; }

        public PreparedJsonDocumentHandle Handle { get; }

        public PreparedDocumentMetadataDto Metadata { get; }

        public IReadOnlyList<RuntimeDiagnosticDto> Diagnostics { get; }

        public long[] LineStartOffsets { get; }

        public int FoldStateRevision { get; private set; }

        public bool IsStructureAvailable => IsIndexReady("structure");

        public bool IsSearchAvailable => IsIndexReady("search");

        public bool IsPathRevealAvailable => IsIndexReady("path");

        public static async ValueTask<PreparedRuntimeSession> CreateAsync(string sessionId, PreparedJsonDocumentHandle handle, CancellationToken cancellationToken)
        {
            await using var sourceStream = await handle.OpenSourceReadStreamAsync(cancellationToken);
            using var buffer = new MemoryStream();
            await sourceStream.CopyToAsync(buffer, cancellationToken);
            var sourceBytes = buffer.ToArray();
            var sourceText = StrictUtf8.GetString(sourceBytes);
            var lineStartOffsets = BuildLineStartOffsets(sourceBytes);
            var sourceLines = BuildSourceLines(sourceBytes, lineStartOffsets);
            var nodesById = new Dictionary<string, PreparedNodeRecord>(StringComparer.Ordinal);
            var nodesByPath = new Dictionary<string, PreparedNodeRecord>(StringComparer.Ordinal);
            var diagnostics = new List<RuntimeDiagnosticDto>();

            try
            {
                var builder = new PreparedNodeBuilder(lineStartOffsets, nodesById, nodesByPath);
                builder.Build(sourceBytes);
            }
            catch (Exception exception) when (exception is JsonException or DecoderFallbackException or InvalidDataException)
            {
                diagnostics.Add(CreateDiagnostic("prepared.decodeFailed", exception.Message));
            }

            var metadata = CreateMetadata(sessionId, handle);
            var lineDepths = BuildLineDepths(sourceLines.Length, nodesById.Values);
            return new PreparedRuntimeSession(sessionId, handle, metadata, diagnostics, nodesById, nodesByPath, lineStartOffsets, sourceLines, lineDepths);
        }

        public IReadOnlyList<PreparedRenderRowDto> GetVisibleRows()
        {
            var hiddenLines = new bool[sourceLines.Length];
            var foldedNodesByLine = new Dictionary<int, PreparedNodeRecord>();
            foreach (var node in nodesById.Values.Where(static node => node.Foldable && node.StartLineIndex < node.EndLineIndex))
            {
                if (!foldedNodeIds.Contains(node.NodeId))
                {
                    continue;
                }

                foldedNodesByLine[node.StartLineIndex] = node;
                for (var lineIndex = node.StartLineIndex + 1; lineIndex <= node.EndLineIndex && lineIndex < hiddenLines.Length; lineIndex++)
                {
                    hiddenLines[lineIndex] = true;
                }
            }

            var visibleRows = new List<PreparedRenderRowDto>(sourceLines.Length);
            for (var lineIndex = 0; lineIndex < sourceLines.Length; lineIndex++)
            {
                if (hiddenLines[lineIndex])
                {
                    continue;
                }

                var lineNode = FindLineNode(lineIndex);
                if (foldedNodesByLine.TryGetValue(lineIndex, out var foldedNode))
                {
                    lineNode = foldedNode;
                }

                var text = foldedNodesByLine.TryGetValue(lineIndex, out var node)
                    ? CreateCollapsedLine(node)
                    : sourceLines[lineIndex];
                var row = new PreparedRenderRowDto(
                    visibleRows.Count,
                    "node",
                    lineNode?.Depth ?? lineDepths[lineIndex],
                    text,
                    lineNode?.Foldable == true ? lineNode.NodeId : null,
                    lineNode?.Foldable == true ? foldedNodeIds.Contains(lineNode.NodeId) : null,
                    LineStartOffsets[lineIndex],
                    GetLineEndOffset(lineIndex),
                    lineNode?.Path);
                visibleRows.Add(row);
            }

            return visibleRows;
        }

        public RuntimeDiagnosticDto GetIndexDiagnostic(string indexName)
        {
            var index = Metadata.Indexes.TryGetValue(indexName, out var state)
                ? state
                : new PreparedIndexStateDto(indexName, "missing", Message: $"Prepared index '{indexName}' is unavailable.");
            var code = index.State switch
            {
                "missing" => "prepared.indexMissing",
                "stale" => "prepared.indexStale",
                "failed" => "prepared.indexFailed",
                _ => "prepared.indexUnavailable"
            };
            return CreateDiagnostic(code, index.Message ?? $"Prepared index '{indexName}' is in state '{index.State}'.");
        }

        public bool TrySetFoldState(string nodeId, bool folded)
        {
            if (!nodesById.TryGetValue(nodeId, out var node) || !node.Foldable)
            {
                return false;
            }

            var changed = folded ? foldedNodeIds.Add(nodeId) : foldedNodeIds.Remove(nodeId);
            if (changed)
            {
                FoldStateRevision++;
            }

            return true;
        }

        public string[] ExpandAncestors(string nodeId)
        {
            var expanded = new List<string>();
            if (!nodesById.TryGetValue(nodeId, out var node))
            {
                return expanded.ToArray();
            }

            var currentParentId = node.ParentId;
            while (currentParentId is not null && nodesById.TryGetValue(currentParentId, out var parent))
            {
                if (foldedNodeIds.Remove(parent.NodeId))
                {
                    expanded.Add(parent.NodeId);
                }

                currentParentId = parent.ParentId;
            }

            if (expanded.Count > 0)
            {
                FoldStateRevision++;
            }

            expanded.Reverse();
            return expanded.ToArray();
        }

        public PreparedNodeRecord? FindNodeContainingOffset(long offset)
            => nodesById.Values
                .Where(node => node.StartOffset <= offset && offset < node.EndOffset)
                .OrderByDescending(node => node.Depth)
                .FirstOrDefault();

        public int GetLineIndex(long offset)
        {
            var index = Array.BinarySearch(LineStartOffsets, offset);
            if (index >= 0)
            {
                return index;
            }

            var insertionPoint = ~index - 1;
            return Math.Clamp(insertionPoint, 0, Math.Max(0, sourceLines.Length - 1));
        }

        public bool TryGetNodeByPath(string path, out PreparedNodeRecord node)
            => nodesByPath.TryGetValue(path, out node!);

        public bool TryGetNode(string nodeId, out PreparedNodeRecord node)
            => nodesById.TryGetValue(nodeId, out node!);

        public void RememberSearchResults(IEnumerable<PreparedSearchResultDto> results)
        {
            searchResultsById.Clear();
            foreach (var result in results)
            {
                searchResultsById[result.ResultId] = result;
            }
        }

        public PreparedNodeRecord? ResolveSearchResultNode(string? resultId, long fallbackOffset)
        {
            if (!string.IsNullOrWhiteSpace(resultId) && searchResultsById.TryGetValue(resultId, out var result))
            {
                if (!string.IsNullOrWhiteSpace(result.NodeId) && nodesById.TryGetValue(result.NodeId, out var node))
                {
                    return node;
                }

                if (!string.IsNullOrWhiteSpace(result.Path) && nodesByPath.TryGetValue(result.Path, out node))
                {
                    return node;
                }

                return FindNodeContainingOffset(result.StartByteOffset);
            }

            return FindNodeContainingOffset(fallbackOffset);
        }

        public async ValueTask DisposeAsync()
        {
            await Handle.DisposeAsync();
        }

        private static PreparedDocumentMetadataDto CreateMetadata(string sessionId, PreparedJsonDocumentHandle handle)
        {
            var indexes = new Dictionary<string, PreparedIndexStateDto>(StringComparer.Ordinal)
            {
                ["line"] = ToIndexState("line", handle.Manifest.Indexes.Line),
                ["structure"] = ToIndexState("structure", handle.Manifest.Indexes.Structure),
                ["search"] = ToIndexState("search", handle.Manifest.Indexes.Search),
                ["path"] = ToIndexState("path", handle.Manifest.Indexes.Path)
            };

            var capabilities = new List<string> { "metadata", "readTextRange", "export" };
            if (IsReady(handle.Manifest.Indexes.Line))
            {
                capabilities.Add("rows");
                capabilities.Add("revealByOffset");
            }

            if (IsReady(handle.Manifest.Indexes.Structure))
            {
                capabilities.Add("fold");
            }

            if (IsReady(handle.Manifest.Indexes.Search))
            {
                capabilities.Add("search");
            }

            if (IsReady(handle.Manifest.Indexes.Path))
            {
                capabilities.Add("revealByJsonPointer");
            }

            return new PreparedDocumentMetadataDto(
                sessionId,
                handle.DocumentId,
                handle.Revision,
                handle.Manifest.SourceLengthBytes == 0 ? handle.Manifest.SourceLength : handle.Manifest.SourceLengthBytes,
                "utf-8",
                ToDocumentState(handle.Manifest.State),
                indexes,
                capabilities);
        }

        private static PreparedIndexStateDto ToIndexState(string name, PreparedDocumentManifestIndexEntry entry)
            => new(name, entry.State.ToString().ToLowerInvariant(), entry.Version, $"Prepared index '{name}' is {entry.State.ToString().ToLowerInvariant()}.");

        private static string ToDocumentState(JsonDocumentPreparationState state)
            => state switch
            {
                JsonDocumentPreparationState.Ready => "ready",
                JsonDocumentPreparationState.Failed => "failed",
                JsonDocumentPreparationState.Deleting => "deleted",
                _ => "unknown"
            };

        private static bool IsReady(PreparedDocumentManifestIndexEntry entry)
            => entry.State == PreparedDocumentIndexState.Ready;

        private bool IsIndexReady(string indexName)
            => Metadata.Indexes.TryGetValue(indexName, out var indexState)
               && string.Equals(indexState.State, "ready", StringComparison.Ordinal);

        private PreparedNodeRecord? FindLineNode(int lineIndex)
            => nodesById.Values
                .Where(node => node.StartLineIndex == lineIndex)
                .OrderByDescending(node => node.Foldable)
                .ThenByDescending(node => node.Depth)
                .FirstOrDefault();

        private string CreateCollapsedLine(PreparedNodeRecord node)
        {
            var startText = sourceLines[node.StartLineIndex];
            var endText = sourceLines[node.EndLineIndex];
            var openCharacter = node.Kind == "object" ? '{' : '[';
            var closeCharacter = node.Kind == "object" ? '}' : ']';
            var openIndex = startText.IndexOf(openCharacter);
            var prefix = openIndex >= 0 ? startText[..(openIndex + 1)] : startText.TrimEnd();
            var closeIndex = endText.LastIndexOf(closeCharacter);
            var suffix = closeIndex >= 0 ? endText[closeIndex..].TrimStart() : endText.Trim();
            return $"{prefix} … {suffix}";
        }

        private long GetLineEndOffset(int lineIndex)
        {
            if (lineIndex + 1 < LineStartOffsets.Length)
            {
                return Math.Max(LineStartOffsets[lineIndex], LineStartOffsets[lineIndex + 1] - 1);
            }

            return Metadata.SourceByteLength;
        }

        private static long[] BuildLineStartOffsets(byte[] sourceBytes)
        {
            var offsets = new List<long> { 0 };
            for (var index = 0; index < sourceBytes.Length; index++)
            {
                if (sourceBytes[index] == (byte)'\n')
                {
                    offsets.Add(index + 1L);
                }
            }

            return offsets.ToArray();
        }

        private static string[] BuildSourceLines(byte[] sourceBytes, long[] lineStartOffsets)
        {
            var lines = new string[lineStartOffsets.Length];
            for (var lineIndex = 0; lineIndex < lineStartOffsets.Length; lineIndex++)
            {
                var start = (int)lineStartOffsets[lineIndex];
                var endExclusive = lineIndex + 1 < lineStartOffsets.Length
                    ? (int)lineStartOffsets[lineIndex + 1]
                    : sourceBytes.Length;
                if (endExclusive > start && sourceBytes[endExclusive - 1] == (byte)'\n')
                {
                    endExclusive--;
                }

                if (endExclusive > start && sourceBytes[endExclusive - 1] == (byte)'\r')
                {
                    endExclusive--;
                }

                lines[lineIndex] = StrictUtf8.GetString(sourceBytes, start, Math.Max(0, endExclusive - start));
            }

            return lines;
        }

        private static int[] BuildLineDepths(int lineCount, IEnumerable<PreparedNodeRecord> nodes)
        {
            var depths = new int[lineCount];
            foreach (var node in nodes)
            {
                for (var lineIndex = node.StartLineIndex; lineIndex <= node.EndLineIndex && lineIndex < depths.Length; lineIndex++)
                {
                    depths[lineIndex] = Math.Max(depths[lineIndex], node.Depth);
                }
            }

            return depths;
        }
    }

    private sealed class PreparedNodeBuilder(long[] lineStartOffsets, IDictionary<string, PreparedNodeRecord> nodesById, IDictionary<string, PreparedNodeRecord> nodesByPath)
    {
        private int nextNodeId = 1;

        public void Build(byte[] bytes)
        {
            var reader = new Utf8JsonReader(bytes, new JsonReaderOptions
            {
                AllowTrailingCommas = false,
                CommentHandling = JsonCommentHandling.Disallow
            });

            if (!reader.Read())
            {
                throw new InvalidDataException("Prepared document source is empty.");
            }

            ParseValue(ref reader, string.Empty, 0, parentId: null);
        }

        private PreparedNodeRecord ParseValue(ref Utf8JsonReader reader, string path, int depth, string? parentId)
        {
            return reader.TokenType switch
            {
                JsonTokenType.StartObject => ParseObject(ref reader, path, depth, parentId),
                JsonTokenType.StartArray => ParseArray(ref reader, path, depth, parentId),
                JsonTokenType.String => CreateScalarNode("string", path, depth, parentId, reader.TokenStartIndex, reader.BytesConsumed),
                JsonTokenType.Number => CreateScalarNode("number", path, depth, parentId, reader.TokenStartIndex, reader.BytesConsumed),
                JsonTokenType.True or JsonTokenType.False => CreateScalarNode("boolean", path, depth, parentId, reader.TokenStartIndex, reader.BytesConsumed),
                JsonTokenType.Null => CreateScalarNode("null", path, depth, parentId, reader.TokenStartIndex, reader.BytesConsumed),
                _ => throw new InvalidDataException($"Prepared document token '{reader.TokenType}' is not supported.")
            };
        }

        private PreparedNodeRecord ParseObject(ref Utf8JsonReader reader, string path, int depth, string? parentId)
        {
            var node = CreateContainerNode("object", path, depth, parentId, reader.TokenStartIndex);
            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndObject)
                {
                    return CompleteContainerNode(node, reader.BytesConsumed);
                }

                if (reader.TokenType != JsonTokenType.PropertyName)
                {
                    throw new InvalidDataException("Expected a JSON property name while building prepared runtime rows.");
                }

                var propertyName = reader.GetString() ?? string.Empty;
                if (!reader.Read())
                {
                    throw new InvalidDataException("Unexpected end of prepared document content.");
                }

                ParseValue(ref reader, AppendJsonPointer(path, propertyName), depth + 1, node.NodeId);
            }

            throw new InvalidDataException("Unexpected end of object while building prepared runtime rows.");
        }

        private PreparedNodeRecord ParseArray(ref Utf8JsonReader reader, string path, int depth, string? parentId)
        {
            var node = CreateContainerNode("array", path, depth, parentId, reader.TokenStartIndex);
            var itemIndex = 0;
            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndArray)
                {
                    return CompleteContainerNode(node, reader.BytesConsumed);
                }

                ParseValue(ref reader, AppendJsonPointer(path, itemIndex.ToString()), depth + 1, node.NodeId);
                itemIndex++;
            }

            throw new InvalidDataException("Unexpected end of array while building prepared runtime rows.");
        }

        private PreparedNodeRecord CreateContainerNode(string kind, string path, int depth, string? parentId, long startOffset)
        {
            var node = new PreparedNodeRecord(
                $"prepared-node-{nextNodeId++}",
                kind,
                path,
                depth,
                startOffset,
                startOffset,
                GetLineIndex(startOffset),
                GetLineIndex(startOffset),
                parentId,
                true);
            nodesById[node.NodeId] = node;
            nodesByPath[path] = node;
            return node;
        }

        private PreparedNodeRecord CompleteContainerNode(PreparedNodeRecord node, long endOffset)
        {
            var completed = node with
            {
                EndOffset = endOffset,
                EndLineIndex = GetLineIndex(Math.Max(node.StartOffset, endOffset - 1))
            };
            nodesById[node.NodeId] = completed;
            nodesByPath[node.Path] = completed;
            return completed;
        }

        private PreparedNodeRecord CreateScalarNode(string kind, string path, int depth, string? parentId, long startOffset, long endOffset)
        {
            var node = new PreparedNodeRecord(
                $"prepared-node-{nextNodeId++}",
                kind,
                path,
                depth,
                startOffset,
                endOffset,
                GetLineIndex(startOffset),
                GetLineIndex(Math.Max(startOffset, endOffset - 1)),
                parentId,
                false);
            nodesById[node.NodeId] = node;
            nodesByPath[path] = node;
            return node;
        }

        private int GetLineIndex(long offset)
        {
            var index = Array.BinarySearch(lineStartOffsets, offset);
            if (index >= 0)
            {
                return index;
            }

            return Math.Clamp((~index) - 1, 0, Math.Max(0, lineStartOffsets.Length - 1));
        }

        private static string AppendJsonPointer(string path, string segment)
            => $"{path}/{segment.Replace("~", "~0", StringComparison.Ordinal).Replace("/", "~1", StringComparison.Ordinal)}";
    }

    private sealed record PreparedNodeRecord(
        string NodeId,
        string Kind,
        string Path,
        int Depth,
        long StartOffset,
        long EndOffset,
        int StartLineIndex,
        int EndLineIndex,
        string? ParentId,
        bool Foldable);
}
