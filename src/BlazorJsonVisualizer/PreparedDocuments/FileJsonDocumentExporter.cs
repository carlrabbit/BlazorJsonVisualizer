namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class FileJsonDocumentExporter(IPreparedJsonDocumentStore store) : IJsonDocumentExporter
{
    public async ValueTask ExportAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(destination);
        ArgumentNullException.ThrowIfNull(options);

        if (!destination.CanWrite)
        {
            throw new InvalidOperationException("Destination stream must be writable.");
        }

        await using var handle = await store.OpenAsync(documentId, cancellationToken);

        if (handle.Manifest.State != JsonDocumentPreparationState.Ready)
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' is not ready for export.");
        }

        await using var source = await handle.OpenSourceReadStreamAsync(cancellationToken);
        await source.CopyToAsync(destination, cancellationToken);
    }
}
