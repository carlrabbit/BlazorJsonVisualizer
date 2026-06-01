namespace BlazorJsonVisualizer.Storage.EFCore.Entities;

public sealed class PreparedJsonDocumentDiagnosticEntity
{
    public long Id { get; set; }
    public string DocumentId { get; set; } = string.Empty;
    public string? JobId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Severity { get; set; } = "Error";
    public string Message { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
