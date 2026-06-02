using System.Buffers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using BlazorJsonVisualizer.Protocol;
using BlazorJsonVisualizer.Storage;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class PreparedJsonDocumentHandle : IAsyncDisposable
{
    private readonly PreparedDocumentContainer container;
    private readonly PreparedDocumentReadLease lease;
    private bool disposed;

    internal PreparedJsonDocumentHandle(PreparedDocumentContainer container, PreparedDocumentReadLease lease, PreparedDocumentManifest manifest)
    {
        this.container = container;
        this.lease = lease;
        DocumentId = container.DocumentId;
        Manifest = manifest;
    }

    public string DocumentId { get; }

    public long Revision => Manifest.LatestRevision;

    public PreparedDocumentManifest Manifest { get; }

    public ValueTask<Stream> OpenSourceReadStreamAsync(CancellationToken cancellationToken = default)
        => ValueTask.FromResult<Stream>(new ChunkSequenceReadStream(container, GetChunkNames(), cancellationToken));

    public async ValueTask<Stream> OpenSourceRangeAsync(long startOffset, long length, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (startOffset < 0 || length < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(startOffset), "Range offsets must be non-negative.");
        }

        var sourceLength = Manifest.SourceLengthBytes == 0 ? Manifest.SourceLength : Manifest.SourceLengthBytes;
        if (startOffset > sourceLength)
        {
            throw new ArgumentOutOfRangeException(nameof(startOffset), "Range start is beyond the source length.");
        }

        var boundedLength = Math.Min(length, sourceLength - startOffset);
        var chunkSize = Manifest.SourceChunkSizeBytes;
        if (chunkSize <= 0)
        {
            throw new InvalidDataException($"Prepared document '{DocumentId}' has invalid chunk metadata.");
        }

        var stream = new MemoryStream(capacity: (int)Math.Min(boundedLength, int.MaxValue));
        var remaining = boundedLength;
        var currentOffset = startOffset;
        while (remaining > 0)
        {
            var chunkIndex = currentOffset / chunkSize;
            var offsetInChunk = currentOffset % chunkSize;
            var toRead = Math.Min(remaining, chunkSize - offsetInChunk);
            var chunkName = new PreparedDocumentObjectName($"source/chunks/{chunkIndex:D10}.chunk");
            await using var chunkRange = await container.OpenRangeReadAsync(chunkName, offsetInChunk, toRead, cancellationToken);
            await chunkRange.CopyToAsync(stream, cancellationToken);
            remaining -= toRead;
            currentOffset += toRead;
        }

        stream.Position = 0;
        return stream;
    }

    public ValueTask<Stream> OpenTransactionsReadStreamAsync(CancellationToken cancellationToken = default)
        => container.OpenReadAsync(new PreparedDocumentObjectName(PreparedDocumentFileNames.TransactionsFileName), cancellationToken);

    public async IAsyncEnumerable<PreparedDocumentSearchResult> SearchAsync(
        PreparedDocumentSearchQuery query,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        if (string.IsNullOrEmpty(query.Text) || query.MaxResults <= 0)
        {
            yield break;
        }

        if (query.Scope != PreparedDocumentSearchScope.AllText)
        {
            throw new NotSupportedException("Property-name and string-value scoped search require the path index and are not implemented by this storage engine yet.");
        }

        var startOffset = ParseContinuationToken(query.ContinuationToken);
        var sourceLength = Manifest.SourceLengthBytes == 0 ? Manifest.SourceLength : Manifest.SourceLengthBytes;
        if (startOffset >= sourceLength)
        {
            yield break;
        }

        var needle = Encoding.UTF8.GetBytes(query.Text);
        var comparison = query.IgnoreCase ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
        var emitted = 0;
        const int blockSize = 64 * 1024;
        var overlapChars = Math.Max(query.Text.Length - 1, 0);
        var absoluteOffset = startOffset;
        var carry = string.Empty;
        await using var source = await OpenSourceRangeAsync(startOffset, sourceLength - startOffset, cancellationToken);
        var buffer = ArrayPool<byte>.Shared.Rent(blockSize);
        try
        {
            while (emitted < query.MaxResults)
            {
                var read = await source.ReadAsync(buffer.AsMemory(0, blockSize), cancellationToken);
                if (read == 0)
                {
                    break;
                }

                var text = carry + Encoding.UTF8.GetString(buffer, 0, read);
                var scanBaseOffset = absoluteOffset - Encoding.UTF8.GetByteCount(carry);
                var scanIndex = 0;
                while (emitted < query.MaxResults)
                {
                    var matchIndex = text.IndexOf(query.Text, scanIndex, comparison);
                    if (matchIndex < 0)
                    {
                        break;
                    }

                    var matchOffset = scanBaseOffset + Encoding.UTF8.GetByteCount(text.AsSpan(0, matchIndex));
                    var endOffset = matchOffset + needle.Length;
                    var preview = BuildPreview(text, matchIndex, query.Text.Length);
                    yield return new PreparedDocumentSearchResult(DocumentId, Revision, matchOffset, endOffset, preview, JsonPointer: null);
                    emitted++;
                    scanIndex = matchIndex + Math.Max(query.Text.Length, 1);
                }

                carry = text.Length > overlapChars ? text[^overlapChars..] : text;
                absoluteOffset += read;
            }
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }

    public async ValueTask ExportAsync(Stream destination, JsonDocumentExportOptions options, CancellationToken cancellationToken = default)
    {
        await ExportWithResultAsync(destination, options, cancellationToken);
    }

    public async ValueTask<JsonDocumentExportResult> ExportWithResultAsync(Stream destination, JsonDocumentExportOptions options, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(destination);
        ArgumentNullException.ThrowIfNull(options);
        if (!destination.CanWrite)
        {
            throw new InvalidOperationException("Destination stream must be writable.");
        }

        var transactions = await ReadTransactionsAsync(cancellationToken);
        if (transactions.Count == 0)
        {
            await using var source = await OpenSourceReadStreamAsync(cancellationToken);
            await source.CopyToAsync(destination, cancellationToken);
            return new JsonDocumentExportResult(DocumentId, Revision, 0, null, options.FormattingPolicy, []);
        }

        ValidateTransactionRevisions(transactions);
        await ExportMaterializedJsonAsync(destination, transactions, options, cancellationToken);
        var latestTransaction = transactions[^1];
        return new JsonDocumentExportResult(DocumentId, latestTransaction.Revision, transactions.Count, latestTransaction.TransactionId, options.FormattingPolicy, []);
    }

    public async ValueTask DisposeAsync()
    {
        if (!disposed)
        {
            disposed = true;
            await lease.DisposeAsync();
        }
    }


    private async ValueTask<IReadOnlyList<PreparedDocumentTransactionDto>> ReadTransactionsAsync(CancellationToken cancellationToken)
    {
        if (Manifest.Transactions.Count == 0)
        {
            return [];
        }

        await using var stream = await OpenTransactionsReadStreamAsync(cancellationToken);
        var log = await JsonSerializer.DeserializeAsync<PreparedTransactionLogDto>(stream, FilePreparedJsonDocumentStore.JsonOptions, cancellationToken);
        return log?.Transactions?.ToArray() ?? [];
    }

    private void ValidateTransactionRevisions(IReadOnlyList<PreparedDocumentTransactionDto> transactions)
    {
        var expectedBaseRevision = 1L;
        foreach (var transaction in transactions)
        {
            if (!string.Equals(transaction.DocumentId, DocumentId, StringComparison.Ordinal)
                || transaction.BaseRevision != expectedBaseRevision
                || transaction.Revision != expectedBaseRevision + 1)
            {
                ThrowExportFailure(
                    "prepared.revisionMismatch",
                    $"Prepared document '{DocumentId}' has an inconsistent transaction revision chain at transaction '{transaction.TransactionId}'.");
            }

            if (!IsSupportedExportTransaction(transaction.Kind))
            {
                ThrowExportFailure(
                    "prepared.exportUnsupportedTransaction",
                    $"Export cannot materialize prepared document transaction kind '{transaction.Kind}'.");
            }

            expectedBaseRevision = transaction.Revision;
        }

        if (expectedBaseRevision != Revision)
        {
            ThrowExportFailure(
                "prepared.revisionMismatch",
                $"Prepared document '{DocumentId}' manifest revision {Revision} does not match transaction log revision {expectedBaseRevision}.");
        }
    }

    private async ValueTask ExportMaterializedJsonAsync(
        Stream destination,
        IReadOnlyList<PreparedDocumentTransactionDto> transactions,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken)
    {
        await using var source = await OpenSourceReadStreamAsync(cancellationToken);
        JsonNode? root;
        try
        {
            root = await JsonNode.ParseAsync(source, cancellationToken: cancellationToken);
        }
        catch (Exception exception) when (exception is JsonException or InvalidOperationException)
        {
            ThrowExportFailure("prepared.decodeFailure", $"Prepared document '{DocumentId}' source could not be decoded for edited export: {exception.Message}");
            throw;
        }

        if (root is null)
        {
            ThrowExportFailure("prepared.decodeFailure", $"Prepared document '{DocumentId}' source is empty.");
        }

        foreach (var transaction in transactions)
        {
            root = ApplyTransaction(root!, transaction);
        }

        var writerOptions = new JsonWriterOptions
        {
            Indented = options.FormattingPolicy == JsonExportFormattingPolicy.PrettyPrintChangedRegions
        };
        await using var writer = new Utf8JsonWriter(destination, writerOptions);
        root!.WriteTo(writer);
        await writer.FlushAsync(cancellationToken);
    }

    private static bool IsSupportedExportTransaction(string kind)
        => kind is PreparedEditCommandKinds.ReplaceNodeValue
            or PreparedEditCommandKinds.RenameProperty
            or PreparedEditCommandKinds.InsertProperty
            or PreparedEditCommandKinds.RemoveProperty
            or PreparedEditCommandKinds.InsertArrayItem
            or PreparedEditCommandKinds.RemoveArrayItem;

    private static JsonNode ApplyTransaction(JsonNode root, PreparedDocumentTransactionDto transaction)
    {
        try
        {
            switch (transaction.Kind)
            {
                case PreparedEditCommandKinds.ReplaceNodeValue:
                    return ReplaceNode(root, transaction.Payload.TargetPath, transaction.Payload.Value);
                case PreparedEditCommandKinds.RenameProperty:
                    RenameProperty(root, transaction.Payload.ParentPath, transaction.Payload.PropertyName, transaction.Payload.NewPropertyName);
                    return root;
                case PreparedEditCommandKinds.InsertProperty:
                    InsertProperty(root, transaction.Payload.ParentPath, transaction.Payload.PropertyName, transaction.Payload.Value);
                    return root;
                case PreparedEditCommandKinds.RemoveProperty:
                    RemoveProperty(root, transaction.Payload.ParentPath, transaction.Payload.PropertyName);
                    return root;
                case PreparedEditCommandKinds.InsertArrayItem:
                    InsertArrayItem(root, transaction.Payload.ParentPath, transaction.Payload.Index, transaction.Payload.Value);
                    return root;
                case PreparedEditCommandKinds.RemoveArrayItem:
                    RemoveArrayItem(root, transaction.Payload.ParentPath, transaction.Payload.Index);
                    return root;
                default:
                    ThrowExportFailure("prepared.exportUnsupportedTransaction", $"Export cannot materialize prepared document transaction kind '{transaction.Kind}'.");
                    return root;
            }
        }
        catch (JsonDocumentExportException)
        {
            throw;
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException or JsonException)
        {
            ThrowExportFailure("prepared.exportUnsupportedTransaction", $"Export cannot materialize transaction '{transaction.TransactionId}': {exception.Message}");
            return root;
        }
    }

    private static JsonNode ReplaceNode(JsonNode root, string? targetPath, JsonElement? value)
    {
        var (parent, segment) = ResolveParent(root, targetPath);
        var replacement = JsonElementToNode(value);
        if (replacement is null)
        {
            throw new InvalidOperationException("Replacement JSON value was null.");
        }

        if (parent is null)
        {
            return replacement;
        }

        if (parent is JsonObject obj)
        {
            obj[segment] = replacement;
            return root;
        }

        if (parent is JsonArray array && int.TryParse(segment, out var index) && index >= 0 && index < array.Count)
        {
            array[index] = replacement;
            return root;
        }

        throw new InvalidOperationException($"JSON Pointer '{targetPath}' does not resolve to a replaceable node.");
    }

    private static void RenameProperty(JsonNode root, string? parentPath, string? propertyName, string? newPropertyName)
    {
        var obj = ResolveObject(root, parentPath);
        if (string.IsNullOrWhiteSpace(propertyName) || string.IsNullOrWhiteSpace(newPropertyName) || !obj.TryGetPropertyValue(propertyName, out var value))
        {
            throw new InvalidOperationException("renameProperty payload does not identify an existing object property.");
        }

        obj.Remove(propertyName);
        obj[newPropertyName] = value;
    }

    private static void InsertProperty(JsonNode root, string? parentPath, string? propertyName, JsonElement? value)
    {
        var obj = ResolveObject(root, parentPath);
        if (string.IsNullOrWhiteSpace(propertyName) || obj.ContainsKey(propertyName))
        {
            throw new InvalidOperationException("insertProperty payload does not identify a new object property.");
        }

        obj[propertyName] = JsonElementToNode(value);
    }

    private static void RemoveProperty(JsonNode root, string? parentPath, string? propertyName)
    {
        var obj = ResolveObject(root, parentPath);
        if (string.IsNullOrWhiteSpace(propertyName) || !obj.Remove(propertyName))
        {
            throw new InvalidOperationException("removeProperty payload does not identify an existing object property.");
        }
    }

    private static void InsertArrayItem(JsonNode root, string? parentPath, int? index, JsonElement? value)
    {
        var array = ResolveArray(root, parentPath);
        if (index is null || index < 0 || index > array.Count)
        {
            throw new InvalidOperationException("insertArrayItem payload index is outside array bounds.");
        }

        array.Insert(index.Value, JsonElementToNode(value));
    }

    private static void RemoveArrayItem(JsonNode root, string? parentPath, int? index)
    {
        var array = ResolveArray(root, parentPath);
        if (index is null || index < 0 || index >= array.Count)
        {
            throw new InvalidOperationException("removeArrayItem payload index is outside array bounds.");
        }

        array.RemoveAt(index.Value);
    }

    private static JsonObject ResolveObject(JsonNode root, string? path)
        => ResolveNode(root, path) as JsonObject
            ?? throw new InvalidOperationException($"JSON Pointer '{path}' does not resolve to an object.");

    private static JsonArray ResolveArray(JsonNode root, string? path)
        => ResolveNode(root, path) as JsonArray
            ?? throw new InvalidOperationException($"JSON Pointer '{path}' does not resolve to an array.");

    private static (JsonNode? Parent, string Segment) ResolveParent(JsonNode root, string? path)
    {
        if (string.IsNullOrEmpty(path))
        {
            return (null, string.Empty);
        }

        var segments = DecodeJsonPointer(path);
        if (segments.Length == 0)
        {
            return (null, string.Empty);
        }

        var parentPath = segments.Length == 1 ? string.Empty : "/" + string.Join('/', segments[..^1].Select(EncodeJsonPointerSegment));
        return (ResolveNode(root, parentPath), segments[^1]);
    }

    private static JsonNode ResolveNode(JsonNode root, string? path)
    {
        var current = root;
        foreach (var segment in DecodeJsonPointer(path))
        {
            current = current switch
            {
                JsonObject obj when obj.TryGetPropertyValue(segment, out var child) && child is not null => child,
                JsonArray array when int.TryParse(segment, out var index) && index >= 0 && index < array.Count && array[index] is not null => array[index]!,
                _ => throw new InvalidOperationException($"JSON Pointer '{path}' does not resolve to a node.")
            };
        }

        return current;
    }

    private static string[] DecodeJsonPointer(string? path)
    {
        if (string.IsNullOrEmpty(path))
        {
            return [];
        }

        if (!path.StartsWith("/", StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"JSON Pointer '{path}' is invalid.");
        }

        return path[1..].Split('/').Select(static segment => segment.Replace("~1", "/", StringComparison.Ordinal).Replace("~0", "~", StringComparison.Ordinal)).ToArray();
    }

    private static string EncodeJsonPointerSegment(string segment)
        => segment.Replace("~", "~0", StringComparison.Ordinal).Replace("/", "~1", StringComparison.Ordinal);

    private static JsonNode? JsonElementToNode(JsonElement? value)
    {
        if (value is null || value.Value.ValueKind == JsonValueKind.Undefined)
        {
            throw new InvalidOperationException("Edit transaction payload does not include a JSON value.");
        }

        return JsonNode.Parse(value.Value.GetRawText());
    }

    private static void ThrowExportFailure(string code, string message)
        => throw new JsonDocumentExportException(new RuntimeDiagnosticDto(code, message, "error"));

    private sealed record PreparedTransactionLogDto(int FormatVersion, IReadOnlyList<PreparedDocumentTransactionDto> Transactions);

    private IReadOnlyList<string> GetChunkNames()
    {
        var sourceLength = Manifest.SourceLengthBytes == 0 ? Manifest.SourceLength : Manifest.SourceLengthBytes;
        if (sourceLength == 0)
        {
            return [];
        }

        var chunkSize = Manifest.SourceChunkSizeBytes;
        var chunkCount = (int)((sourceLength + chunkSize - 1) / chunkSize);
        return Enumerable.Range(0, chunkCount).Select(static index => $"source/chunks/{index:D10}.chunk").ToArray();
    }

    private static long ParseContinuationToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return 0;
        }

        if (!long.TryParse(token, out var offset) || offset < 0)
        {
            throw new ArgumentException("Continuation token must be a non-negative byte offset.", nameof(token));
        }

        return offset;
    }

    private static string BuildPreview(string text, int matchIndex, int matchLength)
    {
        var start = Math.Max(0, matchIndex - 24);
        var end = Math.Min(text.Length, matchIndex + matchLength + 24);
        return text[start..end].Replace('\r', ' ').Replace('\n', ' ');
    }
}
