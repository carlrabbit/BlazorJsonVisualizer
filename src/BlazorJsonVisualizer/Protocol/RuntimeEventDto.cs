namespace BlazorJsonVisualizer.Protocol;

public sealed record RuntimeEventDto(string Type, string SessionId, string? Message = null, bool Recoverable = true);

public static class RuntimeEventTypes
{
    public const string PlaceholderEvent = "placeholderEvent";
    public const string RuntimeError = "runtimeError";
    public const string SessionCreated = "sessionCreated";
    public const string SessionDisposed = "sessionDisposed";
}
