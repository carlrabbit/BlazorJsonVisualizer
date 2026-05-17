using System.Text.Json;

namespace BlazorJsonVisualizer.Protocol;

public sealed record RuntimeDiagnosticDto(string Code, string Message, string Severity, int StartOffset, int EndOffset);

public sealed record RuntimePatchOperationDto(string Kind, string Path, JsonElement? Value = null);

public sealed record RuntimePatchDto(
    string SessionId,
    string DocumentId,
    int BaseRevision,
    int NewRevision,
    string TransactionId,
    IReadOnlyList<RuntimePatchOperationDto> Operations);

public sealed record RuntimeEventDto(
    string Type,
    string SessionId,
    string? Message = null,
    bool Recoverable = true,
    string? DocumentId = null,
    int? NodeCount = null,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null,
    string? TransactionId = null,
    int? BaseRevision = null,
    int? NewRevision = null,
    string? Reason = null,
    RuntimePatchDto? Patch = null);

public static class RuntimeEventTypes
{
    public const string DocumentPatchProduced = "documentPatchProduced";
    public const string DiagnosticsChanged = "diagnosticsChanged";
    public const string DocumentLoaded = "documentLoaded";
    public const string PlaceholderEvent = "placeholderEvent";
    public const string RuntimeError = "runtimeError";
    public const string SessionCreated = "sessionCreated";
    public const string SessionDisposed = "sessionDisposed";
    public const string TransactionApplied = "transactionApplied";
    public const string TransactionRejected = "transactionRejected";
}
