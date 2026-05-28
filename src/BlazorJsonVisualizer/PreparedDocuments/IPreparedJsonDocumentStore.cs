namespace BlazorJsonVisualizer.PreparedDocuments;

public interface IPreparedJsonDocumentStore
{
    ValueTask<PreparedJsonDocumentInfo?> GetAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    ValueTask<IReadOnlyList<PreparedJsonDocumentInfo>> ListAsync(
        CancellationToken cancellationToken = default);

    ValueTask<PreparedJsonDocumentHandle> OpenAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    ValueTask DeleteAsync(
        string documentId,
        CancellationToken cancellationToken = default);
}
