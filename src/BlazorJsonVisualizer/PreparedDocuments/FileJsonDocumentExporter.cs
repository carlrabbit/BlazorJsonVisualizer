namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class FileJsonDocumentExporter(IPreparedJsonDocumentStore store) : IJsonDocumentExporter
{
    public async ValueTask ExportAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default)
    {
        await ExportWithResultAsync(documentId, destination, options, cancellationToken);
    }

    public async ValueTask<JsonDocumentExportResult> ExportWithResultAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default)
    {
        await using var handle = await store.OpenAsync(documentId, cancellationToken);
        return await handle.ExportWithResultAsync(destination, options, cancellationToken);
    }
}
