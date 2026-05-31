namespace BlazorJsonVisualizer.Storage;

public sealed record FilePreparedDocumentStorageOptions
{
    public required string RootDirectory { get; init; }

    public int SourceChunkSizeBytes { get; init; } = 1024 * 1024;

    public bool CreateRootDirectory { get; init; } = true;
}
