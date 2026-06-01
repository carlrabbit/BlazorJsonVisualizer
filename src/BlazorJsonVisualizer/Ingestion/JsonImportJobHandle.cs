namespace BlazorJsonVisualizer.Ingestion;

public sealed record JsonImportJobHandle(string JobId, string? DocumentId, JsonImportJobStatus InitialStatus);
