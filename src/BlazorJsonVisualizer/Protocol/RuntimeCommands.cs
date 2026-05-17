using System.Text.Json;

namespace BlazorJsonVisualizer.Protocol;

public sealed record CreateSessionCommand(string HostElementId, string SessionId, RuntimeOptionsDto? Options = null);

public sealed record DisposeSessionCommand(string SessionId);

public sealed record LoadTextDocumentCommand(string SessionId, string DocumentId, string Text, string ContentType = RuntimeConstants.JsonContentType);

public sealed record SetViewportCommand(string SessionId, double Width, double Height);

public sealed record ToggleFoldCommand(string SessionId, string NodeId);

public sealed record RevealPathCommand(string SessionId, string Path);

public sealed record ApplyTransactionCommand(string SessionId, RuntimeTransactionDto Transaction);

public sealed record UndoCommand(string SessionId);

public sealed record RedoCommand(string SessionId);

public sealed record RuntimeTransactionDto(
    string TransactionId,
    string SessionId,
    int BaseRevision,
    string Kind,
    RuntimeTransactionPayloadDto Payload);

public sealed record RuntimeTransactionPayloadDto(
    string? NodeId = null,
    string? ObjectNodeId = null,
    string? PropertyName = null,
    string? ArrayNodeId = null,
    int? Index = null,
    JsonElement? Value = null);

public static class RuntimeTransactionKinds
{
    public const string InsertArrayItem = "insertArrayItem";
    public const string RemoveArrayItem = "removeArrayItem";
    public const string RemoveProperty = "removeProperty";
    public const string ReplaceValue = "replaceValue";
    public const string SetPropertyValue = "setPropertyValue";
}
