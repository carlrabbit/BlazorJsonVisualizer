namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class PreparedJsonDocumentHandle : IAsyncDisposable
{
    internal PreparedJsonDocumentHandle(string documentId, string documentPath, PreparedDocumentManifest manifest)
    {
        DocumentId = documentId;
        DocumentPath = documentPath;
        Manifest = manifest;
    }

    public string DocumentId { get; }

    public string DocumentPath { get; }

    public PreparedDocumentManifest Manifest { get; }

    public ValueTask<Stream> OpenSourceReadStreamAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = Path.Combine(DocumentPath, PreparedDocumentFileNames.SourceFileName);
        Stream stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        return ValueTask.FromResult(stream);
    }

    public ValueTask<Stream> OpenTransactionsReadStreamAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = Path.Combine(DocumentPath, PreparedDocumentFileNames.TransactionsFileName);
        Stream stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        return ValueTask.FromResult(stream);
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}
