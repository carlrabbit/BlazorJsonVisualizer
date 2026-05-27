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

    public async ValueTask OpenPreparedDocumentAsync(OpenPreparedDocumentCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("openPreparedDocument", command);
    }

    public async ValueTask ClosePreparedDocumentAsync(ClosePreparedDocumentCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("closePreparedDocument", command);
    }

    public async ValueTask GetPreparedDocumentInfoAsync(GetPreparedDocumentInfoCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("getPreparedDocumentInfo", command);
    }

    public async ValueTask RequestSourceRangeAsync(RequestSourceRangeCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("requestSourceRange", command);
    }

    public async ValueTask RequestSearchAsync(RequestSearchCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("requestSearch", command);
    }

    public async ValueTask RevealSearchResultAsync(RevealSearchResultCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("revealSearchResult", command);
    }

    public async ValueTask CreateProjectionAsync(CreateProjectionCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("createProjection", command);
    }

    public async ValueTask DisposeProjectionAsync(DisposeProjectionCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("disposeProjection", command);
    }

    public async ValueTask SelectProjectionItemAsync(SelectProjectionItemCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("selectProjectionItem", command);
    }

    public async ValueTask AttachSchemaAsync(AttachSchemaCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("attachSchema", command);
    }

    public async ValueTask DetachSchemaAsync(DetachSchemaCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("detachSchema", command);
    }

    public async ValueTask<SchemaNodeMetadataDto?> GetSchemaMetadataForPathAsync(GetSchemaMetadataForPathCommand command)
    {
        var module = await moduleTask.Value;
        return await module.InvokeAsync<SchemaNodeMetadataDto?>("getSchemaMetadataForPath", command);
    }

    public async ValueTask SetViewportAsync(SetViewportCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("setViewport", command);
    }

    public async ValueTask ToggleFoldAsync(ToggleFoldCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("toggleFold", command);
    }

    public async ValueTask RevealPathAsync(RevealPathCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("revealPath", command);
    }

    public async ValueTask ApplyTransactionAsync(ApplyTransactionCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("applyTransaction", command);
    }

    public async ValueTask UndoAsync(UndoCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("undo", command);
    }

    public async ValueTask RedoAsync(RedoCommand command)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("redo", command);
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
