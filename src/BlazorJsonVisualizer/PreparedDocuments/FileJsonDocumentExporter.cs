namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class FileJsonDocumentExporter(IPreparedJsonDocumentStore store) : IJsonDocumentExporter
{
    public async ValueTask ExportAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default)
    {
        await using var handle = await store.OpenAsync(documentId, cancellationToken);
        await handle.ExportAsync(destination, options, cancellationToken);
    }
}
