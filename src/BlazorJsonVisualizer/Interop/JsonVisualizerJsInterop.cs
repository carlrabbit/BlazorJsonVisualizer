using BlazorJsonVisualizer.Protocol;
using Microsoft.JSInterop;

namespace BlazorJsonVisualizer.Interop;

public sealed class JsonVisualizerJsInterop(IJSRuntime jsRuntime) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> moduleTask = new(() => jsRuntime
        .InvokeAsync<IJSObjectReference>("import", "./_content/BlazorJsonVisualizer/runtime-blazor.js")
        .AsTask());

    public async ValueTask<string> GetRuntimeProtocolVersionAsync()
    {
        var module = await moduleTask.Value;
        return await module.InvokeAsync<string>("getRuntimeProtocolVersion");
    }

    public async ValueTask CreateSessionAsync<T>(CreateSessionCommand command, DotNetObjectReference<T> callbackTarget)
        where T : class
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("createSession", command, callbackTarget);
    }

    public async ValueTask LoadTextDocumentAsync(LoadTextDocumentCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("loadTextDocument", command);
    }

    public async ValueTask SetViewportAsync(SetViewportCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("setViewport", command);
    }

    public async ValueTask DisposeSessionAsync(DisposeSessionCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("disposeSession", command);
    }

    public async ValueTask DisposeAsync()
    {
        if (!moduleTask.IsValueCreated)
        {
            return;
        }

        var module = await moduleTask.Value;
        await module.DisposeAsync();
    }
}
