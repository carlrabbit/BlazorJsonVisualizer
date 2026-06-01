namespace BlazorJsonVisualizer.Storage.EFCore.Entities;

public sealed class PreparedJsonDocumentTransactionEntity
{
    public long Id { get; set; }
    public string DocumentId { get; set; } = string.Empty;
    public int TransactionIndex { get; set; }
    public int Revision { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public byte[]? Payload { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
