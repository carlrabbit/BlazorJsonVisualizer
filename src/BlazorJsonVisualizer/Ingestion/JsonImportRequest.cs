using BlazorJsonVisualizer.PreparedDocuments;

namespace BlazorJsonVisualizer.Ingestion;

public sealed record JsonImportRequest
{
    public string? DocumentId { get; init; }

    public bool BuildSearchIndex { get; init; } = true;

    public bool BuildPathIndex { get; init; } = true;

    public bool AllowInvalidJson { get; init; }

    public int? SourceChunkSizeBytes { get; init; }

    public IReadOnlyDictionary<string, string>? Metadata { get; init; }

    public JsonDocumentImportOptions ToDocumentImportOptions()
        => new()
        {
            DocumentId = DocumentId,
            BuildSearchIndex = BuildSearchIndex,
            BuildPathIndex = BuildPathIndex,
            AllowInvalidJson = AllowInvalidJson,
            SourceChunkSizeBytes = SourceChunkSizeBytes
        };
}
