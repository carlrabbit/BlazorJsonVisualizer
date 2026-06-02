namespace BlazorJsonVisualizer.PreparedDocuments;

public interface IJsonDocumentExporter
{
    ValueTask ExportAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default);

    ValueTask<JsonDocumentExportResult> ExportWithResultAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default);
}
