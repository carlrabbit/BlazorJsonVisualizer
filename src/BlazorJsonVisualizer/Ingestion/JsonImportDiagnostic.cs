namespace BlazorJsonVisualizer.Ingestion;

public sealed record JsonImportDiagnostic(
    JsonImportDiagnosticSeverity Severity,
    string Code,
    string Message,
    long? ByteOffset = null,
    long? Line = null,
    long? Column = null,
    string? JsonPointer = null);
