namespace BlazorJsonVisualizer.Storage.EFCore.Entities;

public sealed class PreparedJsonDocumentSearchEntryEntity
{
    public long Id { get; set; }
    public string DocumentId { get; set; } = string.Empty;
    public string NormalizedTerm { get; set; } = string.Empty;
    public string Scope { get; set; } = "AllText";
    public long StartByteOffset { get; set; }
    public long EndByteOffset { get; set; }
    public string? Preview { get; set; }
}
