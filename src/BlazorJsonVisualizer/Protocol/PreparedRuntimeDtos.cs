namespace BlazorJsonVisualizer.Protocol;

public sealed record PreparedViewportRequestDto(
    int FirstRow,
    int RowCount);

public sealed record PreparedOpenRequestDto(
    string SessionId,
    string DocumentId,
    PreparedViewportRequestDto? InitialViewport = null);

public sealed record PreparedOpenResultDto(
    bool Success,
    string SessionId,
    string DocumentId,
    long? Revision = null,
    PreparedDocumentMetadataDto? Metadata = null,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public sealed record PreparedDocumentMetadataDto(
    string SessionId,
    string DocumentId,
    long Revision,
    long SourceByteLength,
    string SourceEncoding,
    string DocumentState,
    IReadOnlyDictionary<string, PreparedIndexStateDto> Indexes,
    IReadOnlyList<string> Capabilities);

public sealed record PreparedIndexStateDto(
    string Name,
    string State,
    int? Version = null,
    string? Message = null);

public sealed record PreparedTextRangeRequestDto(
    string SessionId,
    long StartByteOffset,
    int MaxByteLength);

public sealed record PreparedTextRangeDto(
    string SessionId,
    string DocumentId,
    long Revision,
    long RequestedStartByteOffset,
    long ActualStartByteOffset,
    long ActualEndByteOffset,
    string Text,
    bool Truncated,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public sealed record PreparedRowsRequestDto(
    string SessionId,
    int FirstRow,
    int RowCount,
    int? FoldStateRevision = null);

public sealed record PreparedRowsResultDto(
    string SessionId,
    string DocumentId,
    long Revision,
    int FirstRow,
    int RowCount,
    int? TotalKnownRows,
    IReadOnlyList<PreparedRenderRowDto> Rows,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public sealed record PreparedRenderRowDto(
    int RowIndex,
    string Kind,
    int Depth,
    string Text,
    string? NodeId = null,
    bool? Folded = null,
    long? StartByteOffset = null,
    long? EndByteOffset = null,
    string? Path = null,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public sealed record PreparedFoldStateRequestDto(
    string SessionId,
    string NodeId,
    bool Folded);

public sealed record PreparedFoldStateResultDto(
    bool Success,
    int FoldStateRevision,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public sealed record PreparedSearchRequestDto(
    string SessionId,
    string Query,
    string Scope = "allText",
    bool IgnoreCase = true,
    int MaxResults = 50,
    string? ContinuationToken = null);

public sealed record PreparedSearchResultPageDto(
    string SessionId,
    string DocumentId,
    long Revision,
    IReadOnlyList<PreparedSearchResultDto> Results,
    string? ContinuationToken = null,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public sealed record PreparedSearchResultDto(
    string ResultId,
    long Revision,
    long StartByteOffset,
    long EndByteOffset,
    string Preview,
    string? Path = null,
    string? NodeId = null);

public sealed record PreparedRevealRequestDto(
    string SessionId,
    PreparedRevealTargetDto Target);

public sealed record PreparedRevealTargetDto(
    string Kind,
    long? StartByteOffset = null,
    long? EndByteOffset = null,
    string? ResultId = null,
    string? Path = null,
    string? NodeId = null);

public sealed record PreparedRevealResultDto(
    bool Success,
    string SessionId,
    string DocumentId,
    string? Reason = null,
    int? RowIndex = null,
    string? NodeId = null,
    PreparedViewportRequestDto? Viewport = null,
    IReadOnlyList<string>? ExpandedNodeIds = null,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public sealed record PreparedCloseResultDto(
    bool Success,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);
