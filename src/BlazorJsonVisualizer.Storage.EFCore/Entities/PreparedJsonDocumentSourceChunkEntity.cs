namespace BlazorJsonVisualizer.Storage.EFCore.Entities;

public sealed class PreparedJsonDocumentSourceChunkEntity
{
    public long Id { get; set; }
    public string DocumentId { get; set; } = string.Empty;
    public int ChunkIndex { get; set; }
    public long StartByteOffset { get; set; }
    public int LengthBytes { get; set; }
    public byte[] Content { get; set; } = [];
}
