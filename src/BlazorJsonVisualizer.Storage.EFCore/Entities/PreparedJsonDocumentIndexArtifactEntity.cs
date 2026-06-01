namespace BlazorJsonVisualizer.Storage.EFCore.Entities;

public sealed class PreparedJsonDocumentIndexArtifactEntity
{
    public long Id { get; set; }
    public string DocumentId { get; set; } = string.Empty;
    public string IndexName { get; set; } = string.Empty;
    public int Revision { get; set; } = 1;
    public byte[] Payload { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; }
}
