namespace BlazorJsonVisualizer.Storage.EFCore.Entities;

public sealed class PreparedJsonDocumentStructuralNodeEntity
{
    public long Id { get; set; }
    public string DocumentId { get; set; } = string.Empty;
    public int NodeIndex { get; set; }
    public string NodeType { get; set; } = string.Empty;
    public long StartByteOffset { get; set; }
    public long EndByteOffset { get; set; }
    public int Depth { get; set; }
    public string? JsonPointer { get; set; }
    public string? PropertyName { get; set; }
}
