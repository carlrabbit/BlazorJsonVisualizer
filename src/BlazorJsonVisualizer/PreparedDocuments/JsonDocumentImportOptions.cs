namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed record JsonDocumentImportOptions
{
    public string? DocumentId { get; init; }

    public bool BuildSearchIndex { get; init; } = true;

    public bool BuildPathIndex { get; init; } = true;

    public bool AllowInvalidJson { get; init; }
}
