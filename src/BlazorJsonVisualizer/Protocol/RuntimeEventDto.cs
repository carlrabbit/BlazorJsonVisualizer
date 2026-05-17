namespace BlazorJsonVisualizer.Protocol;

public sealed record RuntimeDiagnosticDto(string Code, string Message, string Severity, int StartOffset, int EndOffset);

public sealed record RuntimeEventDto(
    string Type,
    string SessionId,
    string? Message = null,
    bool Recoverable = true,
    string? DocumentId = null,
    int? NodeCount = null,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null);

public static class RuntimeEventTypes
{
    public const string DiagnosticsChanged = "diagnosticsChanged";
    public const string DocumentLoaded = "documentLoaded";
    public const string PlaceholderEvent = "placeholderEvent";
    public const string RuntimeError = "runtimeError";
    public const string SessionCreated = "sessionCreated";
    public const string SessionDisposed = "sessionDisposed";
}
