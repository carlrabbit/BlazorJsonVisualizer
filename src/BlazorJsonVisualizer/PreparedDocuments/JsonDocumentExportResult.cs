using BlazorJsonVisualizer.Protocol;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed record JsonDocumentExportResult(
    string DocumentId,
    long ExportedRevision,
    int TransactionCount,
    string? LatestTransactionId,
    JsonExportFormattingPolicy FormattingPolicy,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);
