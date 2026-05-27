namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed record PreparedJsonDocumentInfo(
    string DocumentId,
    long SourceLength,
    string? SourceHash,
    JsonDocumentPreparationState State,
    DateTimeOffset CreatedAt);
