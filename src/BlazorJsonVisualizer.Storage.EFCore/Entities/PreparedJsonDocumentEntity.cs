namespace BlazorJsonVisualizer.Storage.EFCore.Entities;

public sealed class PreparedJsonDocumentEntity
{
    public string DocumentId { get; set; } = string.Empty;
    public int FormatVersion { get; set; } = 1;
    public string State { get; set; } = "Importing";
    public long SourceLengthBytes { get; set; }
    public string? SourceHash { get; set; }
    public string SourceEncoding { get; set; } = "utf-8";
    public int SourceChunkSizeBytes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public int LatestRevision { get; set; } = 1;
    public byte[]? ConcurrencyToken { get; set; }
    public string LineIndexState { get; set; } = "Missing";
    public string StructureIndexState { get; set; } = "Missing";
    public string SearchIndexState { get; set; } = "Missing";
    public string PathIndexState { get; set; } = "Missing";
    public string TransactionState { get; set; } = "Ready";
    public int TransactionCount { get; set; }
    public int TransactionLatestRevision { get; set; } = 1;
}
