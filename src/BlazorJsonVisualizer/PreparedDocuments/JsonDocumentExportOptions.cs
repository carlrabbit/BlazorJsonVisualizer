namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed record JsonDocumentExportOptions
{
    public JsonExportFormattingPolicy FormattingPolicy { get; init; } = JsonExportFormattingPolicy.PreserveUnchangedRegions;
}
