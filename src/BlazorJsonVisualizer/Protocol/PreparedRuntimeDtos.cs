using System.Text.Json;

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
    string? NodeId = null,
    long? Revision = null);

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
public sealed record PreparedEditCommandDto(
    string SessionId,
    string DocumentId,
    long BaseRevision,
    string Kind,
    string? TargetNodeId = null,
    string? TargetPath = null,
    string? PropertyName = null,
    string? NewPropertyName = null,
    int? Index = null,
    JsonElement? Value = null,
    string? Label = null);

public sealed record PreparedEditResultDto(
    bool Success,
    string SessionId,
    string DocumentId,
    long BaseRevision,
    long Revision,
    bool Dirty,
    PreparedDocumentTransactionDto? Transaction = null,
    IReadOnlyList<PreparedChangedRangeDto>? ChangedRanges = null,
    IReadOnlyList<string>? ChangedNodeIds = null,
    IReadOnlyList<PreparedIndexStateDto>? InvalidatedIndexes = null,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public sealed record PreparedDocumentTransactionDto(
    string TransactionId,
    string SessionId,
    string DocumentId,
    long BaseRevision,
    long Revision,
    string Kind,
    PreparedEditTransactionPayloadDto Payload,
    DateTimeOffset CreatedAt,
    string? Label = null);

public sealed record PreparedEditTransactionPayloadDto(
    string? TargetNodeId = null,
    string? TargetPath = null,
    string? ParentNodeId = null,
    string? ParentPath = null,
    string? PropertyName = null,
    string? NewPropertyName = null,
    int? Index = null,
    JsonElement? Value = null);

public sealed record PreparedChangedRangeDto(
    long StartByteOffset,
    long EndByteOffset,
    string? NodeId = null,
    string? Path = null);

public static class PreparedEditCommandKinds
{
    public const string ReplaceNodeValue = "replaceNodeValue";
    public const string RenameProperty = "renameProperty";
    public const string InsertProperty = "insertProperty";
    public const string RemoveProperty = "removeProperty";
    public const string InsertArrayItem = "insertArrayItem";
    public const string RemoveArrayItem = "removeArrayItem";
}

public sealed record SchemaOverlayAttachRequestDto(
    string SessionId,
    string DocumentId,
    long BaseRevision,
    string SchemaId,
    SchemaSourceDto Source,
    SchemaOverlayOptionsDto? Options = null);

public sealed record SchemaSourceDto(
    string Kind,
    JsonElement? Schema = null,
    string? SchemaId = null,
    string? SourceDescription = null);

public sealed record SchemaOverlayOptionsDto(
    int? MaxDiagnostics = null,
    bool? IncludeUnsupportedKeywordDiagnostics = null);

public sealed record SchemaOverlayAttachResultDto(
    bool Success,
    string SessionId,
    string DocumentId,
    long Revision,
    string? OverlayId = null,
    string? SchemaId = null,
    IReadOnlyList<SchemaOverlayDiagnosticDto>? Diagnostics = null);

public sealed record SchemaOverlayDetachRequestDto(
    string SessionId,
    string DocumentId,
    string? OverlayId = null);

public sealed record SchemaOverlayDetachResultDto(
    bool Success,
    string SessionId,
    string DocumentId,
    string? DetachedOverlayId = null,
    IReadOnlyList<SchemaOverlayDiagnosticDto>? Diagnostics = null);

public sealed record SchemaOverlayTargetDto(
    string Kind,
    string? Path = null,
    string? NodeId = null,
    int? RowIndex = null);

public sealed record SchemaDetailsRequestDto(
    string SessionId,
    string DocumentId,
    long Revision,
    SchemaOverlayTargetDto Target);

public sealed record SchemaDetailsResultDto(
    bool Success,
    string SessionId,
    string DocumentId,
    long Revision,
    string? OverlayId = null,
    SchemaOverlayTargetDto? Target = null,
    SchemaNodeMetadataDto? Metadata = null,
    IReadOnlyList<SchemaOverlayDiagnosticDto>? Diagnostics = null);

public sealed record SchemaValidationRequestDto(
    string SessionId,
    string DocumentId,
    long Revision,
    SchemaOverlayTargetDto? Target = null,
    int MaxDiagnostics = 50,
    string? ContinuationToken = null);

public sealed record SchemaValidationResultDto(
    bool Success,
    string SessionId,
    string DocumentId,
    long Revision,
    string? OverlayId = null,
    IReadOnlyList<SchemaOverlayDiagnosticDto>? Diagnostics = null,
    string? ContinuationToken = null,
    bool Truncated = false);

public sealed record SchemaOverlayDiagnosticDto(
    string DiagnosticId,
    string Category,
    string Severity,
    string Source,
    string SessionId,
    string DocumentId,
    long? Revision = null,
    string? OverlayId = null,
    string? SchemaId = null,
    string? NodeId = null,
    string? Path = null,
    string? SchemaPath = null,
    string Message = "",
    string? Recoverability = null);
