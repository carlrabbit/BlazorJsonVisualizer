using BlazorJsonVisualizer.PreparedDocuments;

namespace BlazorJsonVisualizer.Ingestion;

public sealed record JsonImportResult(
    string JobId,
    JsonImportResultState State,
    PreparedJsonDocumentInfo? Document = null,
    IReadOnlyList<JsonImportDiagnostic>? Diagnostics = null,
    string? FailureMessage = null);
