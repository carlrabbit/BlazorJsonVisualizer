namespace BlazorJsonVisualizer.Storage.EFCore;

public sealed class BlazorJsonVisualizerEfCoreStorageModelOptions
{
    public string? Schema { get; set; }

    public string TablePrefix { get; set; } = "Bjv";
}
