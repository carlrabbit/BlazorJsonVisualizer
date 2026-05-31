namespace BlazorJsonVisualizer.Storage;

public interface IPreparedDocumentStorageProvider
{
    ValueTask<PreparedDocumentStorageCapabilities> GetCapabilitiesAsync(CancellationToken cancellationToken = default);

    ValueTask<PreparedDocumentContainer> CreateContainerAsync(string documentId, CancellationToken cancellationToken = default);

    ValueTask<PreparedDocumentContainer?> TryOpenContainerAsync(string documentId, CancellationToken cancellationToken = default);

    IAsyncEnumerable<PreparedDocumentContainerInfo> ListContainersAsync(CancellationToken cancellationToken = default);

    ValueTask DeleteContainerAsync(string documentId, CancellationToken cancellationToken = default);
}

public abstract class PreparedDocumentContainer
{
    public abstract string DocumentId { get; }

    public abstract ValueTask<PreparedDocumentReadLease> AcquireReadLeaseAsync(CancellationToken cancellationToken = default);

    public abstract ValueTask<PreparedDocumentWriteLease> AcquireWriteLeaseAsync(CancellationToken cancellationToken = default);

    public abstract ValueTask<bool> ObjectExistsAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default);

    public abstract ValueTask<Stream> OpenReadAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default);

    public abstract ValueTask<Stream> OpenRangeReadAsync(PreparedDocumentObjectName name, long startOffset, long length, CancellationToken cancellationToken = default);

    public abstract ValueTask<PreparedDocumentObjectWriter> CreateTemporaryObjectAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default);

    public abstract IAsyncEnumerable<PreparedDocumentObjectInfo> ListObjectsAsync(CancellationToken cancellationToken = default);
}

public abstract class PreparedDocumentObjectWriter : IAsyncDisposable
{
    public abstract Stream Stream { get; }

    public abstract ValueTask CommitAsync(CancellationToken cancellationToken = default);

    public abstract ValueTask AbortAsync(CancellationToken cancellationToken = default);

    public abstract ValueTask DisposeAsync();
}

public abstract class PreparedDocumentReadLease : IAsyncDisposable
{
    public abstract ValueTask DisposeAsync();
}

public abstract class PreparedDocumentWriteLease : IAsyncDisposable
{
    public abstract ValueTask DisposeAsync();
}

public sealed record PreparedDocumentStorageCapabilities(
    bool SupportsAtomicObjectCommit,
    bool SupportsRangeRead,
    bool SupportsConcurrentReaders,
    bool SupportsSingleWriterLock,
    bool SupportsObjectListing,
    bool SupportsTemporaryObjects);

public readonly record struct PreparedDocumentObjectName(string Value)
{
    public override string ToString() => Value;
}

public sealed record PreparedDocumentObjectInfo(PreparedDocumentObjectName Name, long Length, DateTimeOffset UpdatedAt);

public sealed record PreparedDocumentContainerInfo(string DocumentId, DateTimeOffset CreatedAt);
