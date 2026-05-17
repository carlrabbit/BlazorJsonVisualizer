using System.Text.Json;

namespace BlazorJsonVisualizer.Protocol;

public sealed record RuntimeDiagnosticDto(
    string Code = "",
    string Message = "",
    string Severity = "error",
    int StartOffset = 0,
    int EndOffset = 0);

public sealed record SchemaDiagnosticDto(
    string DiagnosticId,
    string? NodeId,
    string Path,
    string Severity,
    string Message,
    string Source);

public sealed record SchemaNodeMetadataDto(
    string NodeId,
    string SchemaPath,
    string? Title = null,
    string? Description = null,
    JsonElement? ExpectedType = null,
    IReadOnlyList<JsonElement>? EnumValues = null,
    bool? Required = null,
    JsonElement? DefaultValue = null);

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
    string? SchemaId = null,
    string? ProjectionId = null,
    string? Kind = null,
    string? SourceNodeId = null,
    string? SourcePath = null,
    IReadOnlyList<RuntimeDiagnosticDto>? Diagnostics = null,
    IReadOnlyList<SchemaDiagnosticDto>? SchemaDiagnostics = null,
    IReadOnlyList<string>? AffectedNodeIds = null,
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
    public const string SchemaAttached = "schemaAttached";
    public const string SchemaDiagnosticsChanged = "schemaDiagnosticsChanged";
    public const string SchemaMetadataChanged = "schemaMetadataChanged";
    public const string ProjectionCreated = "projectionCreated";
    public const string ProjectionChanged = "projectionChanged";
    public const string ProjectionSelectionChanged = "projectionSelectionChanged";
    public const string TransactionApplied = "transactionApplied";
    public const string TransactionRejected = "transactionRejected";
}
