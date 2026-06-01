namespace BlazorJsonVisualizer.Storage.EFCore.Entities;

public sealed class PreparedJsonDocumentImportJobEntity
{
    public long Id { get; set; }
    public string JobId { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string State { get; set; } = "Pending";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public string? FailureMessage { get; set; }
}
