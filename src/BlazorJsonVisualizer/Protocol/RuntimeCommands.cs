namespace BlazorJsonVisualizer.Protocol;

public sealed record CreateSessionCommand(string HostElementId, string SessionId, RuntimeOptionsDto? Options = null);

public sealed record DisposeSessionCommand(string SessionId);

public sealed record LoadTextDocumentCommand(string SessionId, string DocumentId, string Text, string ContentType = RuntimeConstants.JsonContentType);

public sealed record SetViewportCommand(string SessionId, double Width, double Height);
