namespace BlazorJsonVisualizer.Ingestion;

public sealed record JsonImportProgress(
    long BytesRead = 0,
    long? TotalBytes = null,
    double? Fraction = null);
