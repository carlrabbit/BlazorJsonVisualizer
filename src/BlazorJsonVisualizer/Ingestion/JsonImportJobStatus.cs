namespace BlazorJsonVisualizer.Ingestion;

public sealed record JsonImportJobStatus(
    string JobId,
    string? DocumentId,
    JsonImportJobState State,
    string Step,
    JsonImportProgress Progress,
    IReadOnlyList<JsonImportDiagnostic> Diagnostics,
    DateTimeOffset StartedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? CompletedAt = null);
