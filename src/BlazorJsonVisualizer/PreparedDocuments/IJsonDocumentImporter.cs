namespace BlazorJsonVisualizer.PreparedDocuments;

public interface IJsonDocumentImporter
{
    ValueTask<PreparedJsonDocumentInfo> ImportAsync(
        Stream source,
        JsonDocumentImportOptions options,
        CancellationToken cancellationToken = default);
}
