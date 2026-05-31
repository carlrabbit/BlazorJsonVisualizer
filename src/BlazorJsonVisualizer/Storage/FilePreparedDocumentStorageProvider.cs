using System.Collections.Concurrent;
using BlazorJsonVisualizer.PreparedDocuments;

namespace BlazorJsonVisualizer.Storage;

public sealed class FilePreparedDocumentStorageProvider : IPreparedDocumentStorageProvider
{
    private static readonly ConcurrentDictionary<string, PreparedDocumentLockState> LockStates = new(StringComparer.OrdinalIgnoreCase);

    public FilePreparedDocumentStorageProvider(FilePreparedDocumentStorageOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (string.IsNullOrWhiteSpace(options.RootDirectory))
        {
            throw new ArgumentException("Root directory is required.", nameof(options));
        }

        if (options.SourceChunkSizeBytes <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(options), "Source chunk size must be greater than zero.");
        }

        Options = options;
        RootDirectory = Path.GetFullPath(options.RootDirectory);
        if (options.CreateRootDirectory)
        {
            Directory.CreateDirectory(RootDirectory);
        }
    }

    public FilePreparedDocumentStorageOptions Options { get; }

    public string RootDirectory { get; }

    public ValueTask<PreparedDocumentStorageCapabilities> GetCapabilitiesAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return ValueTask.FromResult(new PreparedDocumentStorageCapabilities(
            SupportsAtomicObjectCommit: true,
            SupportsRangeRead: true,
            SupportsConcurrentReaders: true,
            SupportsSingleWriterLock: true,
            SupportsObjectListing: true,
            SupportsTemporaryObjects: true));
    }

    public ValueTask<PreparedDocumentContainer> CreateContainerAsync(string documentId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = GetDocumentPath(documentId);
        if (Directory.Exists(path))
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' already exists.");
        }

        Directory.CreateDirectory(path);
        Directory.CreateDirectory(Path.Combine(path, PreparedDocumentFileNames.SourceDirectoryName, PreparedDocumentFileNames.SourceChunksDirectoryName));
        Directory.CreateDirectory(Path.Combine(path, PreparedDocumentFileNames.IndexesDirectoryName));
        Directory.CreateDirectory(Path.Combine(path, PreparedDocumentFileNames.TransactionsDirectoryName));
        Directory.CreateDirectory(Path.Combine(path, PreparedDocumentFileNames.TempDirectoryName));
        return ValueTask.FromResult<PreparedDocumentContainer>(new FilePreparedDocumentContainer(documentId, path, GetLockState(path)));
    }

    public ValueTask<PreparedDocumentContainer?> TryOpenContainerAsync(string documentId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = GetDocumentPath(documentId);
        PreparedDocumentContainer? container = Directory.Exists(path)
            ? new FilePreparedDocumentContainer(documentId, path, GetLockState(path))
            : null;
        return ValueTask.FromResult(container);
    }

    public async IAsyncEnumerable<PreparedDocumentContainerInfo> ListContainersAsync(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!Directory.Exists(RootDirectory))
        {
            yield break;
        }

        foreach (var directory in Directory.EnumerateDirectories(RootDirectory))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var documentId = Path.GetFileName(directory);
            if (!File.Exists(Path.Combine(directory, PreparedDocumentFileNames.ManifestFileName)))
            {
                continue;
            }

            var createdAt = Directory.GetCreationTimeUtc(directory);
            yield return new PreparedDocumentContainerInfo(documentId, new DateTimeOffset(createdAt, TimeSpan.Zero));
            await Task.Yield();
        }
    }

    public ValueTask DeleteContainerAsync(string documentId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = GetDocumentPath(documentId);
        var state = GetLockState(path);
        if (state.ActiveReaders > 0 || state.WriterHeld)
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' cannot be deleted while it has active handles.");
        }

        if (Directory.Exists(path))
        {
            Directory.Delete(path, recursive: true);
        }

        return ValueTask.CompletedTask;
    }

    internal string GetDocumentPath(string documentId)
    {
        ValidateName(documentId, "document id");
        return CombineUnderRoot(RootDirectory, documentId);
    }

    internal static void ValidateObjectName(PreparedDocumentObjectName name) => ValidateName(name.Value, "object name");

    private static PreparedDocumentLockState GetLockState(string path) => LockStates.GetOrAdd(Path.GetFullPath(path), _ => new PreparedDocumentLockState());

    private static void ValidateName(string value, string label)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"Prepared document {label} is required.");
        }

        if (Path.IsPathRooted(value) || value.Contains("..", StringComparison.Ordinal) || value.Contains('\\'))
        {
            throw new ArgumentException($"Prepared document {label} must not contain path traversal.");
        }

        foreach (var segment in value.Split('/'))
        {
            if (string.IsNullOrWhiteSpace(segment) || segment is "." or "..")
            {
                throw new ArgumentException($"Prepared document {label} contains an invalid segment.");
            }
        }
    }

    private static string CombineUnderRoot(string root, string relative)
    {
        var combined = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
        var rootWithSeparator = root.EndsWith(Path.DirectorySeparatorChar) ? root : root + Path.DirectorySeparatorChar;
        if (!combined.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase) && !string.Equals(combined, root, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Path escapes the prepared document storage root.");
        }

        return combined;
    }

    private sealed class PreparedDocumentLockState
    {
        public object SyncRoot { get; } = new();

        public int ActiveReaders { get; set; }

        public bool WriterHeld { get; set; }
    }

    private sealed class FilePreparedDocumentContainer(string documentId, string documentPath, PreparedDocumentLockState lockState) : PreparedDocumentContainer
    {
        public override string DocumentId => documentId;

        public override ValueTask<PreparedDocumentReadLease> AcquireReadLeaseAsync(CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            lock (lockState.SyncRoot)
            {
                if (lockState.WriterHeld)
                {
                    throw new InvalidOperationException($"Prepared document '{documentId}' has an active writer.");
                }

                lockState.ActiveReaders++;
            }

            return ValueTask.FromResult<PreparedDocumentReadLease>(new FileReadLease(lockState));
        }

        public override ValueTask<PreparedDocumentWriteLease> AcquireWriteLeaseAsync(CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            lock (lockState.SyncRoot)
            {
                if (lockState.WriterHeld || lockState.ActiveReaders > 0)
                {
                    throw new InvalidOperationException($"Prepared document '{documentId}' already has active readers or a writer.");
                }

                lockState.WriterHeld = true;
            }

            return ValueTask.FromResult<PreparedDocumentWriteLease>(new FileWriteLease(lockState));
        }

        public override ValueTask<bool> ObjectExistsAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return ValueTask.FromResult(File.Exists(GetObjectPath(name)));
        }

        public override ValueTask<Stream> OpenReadAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Stream stream = File.Open(GetObjectPath(name), FileMode.Open, FileAccess.Read, FileShare.Read);
            return ValueTask.FromResult(stream);
        }

        public override ValueTask<Stream> OpenRangeReadAsync(PreparedDocumentObjectName name, long startOffset, long length, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (startOffset < 0 || length < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(startOffset), "Range offsets must be non-negative.");
            }

            var stream = File.Open(GetObjectPath(name), FileMode.Open, FileAccess.Read, FileShare.Read);
            stream.Seek(startOffset, SeekOrigin.Begin);
            return ValueTask.FromResult<Stream>(new BoundedReadStream(stream, length));
        }

        public override ValueTask<PreparedDocumentObjectWriter> CreateTemporaryObjectAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var destinationPath = GetObjectPath(name);
            var tempDirectory = Path.Combine(documentPath, PreparedDocumentFileNames.TempDirectoryName);
            Directory.CreateDirectory(tempDirectory);
            Directory.CreateDirectory(Path.GetDirectoryName(destinationPath)!);
            var tempPath = Path.Combine(tempDirectory, $"{Guid.NewGuid():n}.tmp");
            return ValueTask.FromResult<PreparedDocumentObjectWriter>(new FileObjectWriter(tempPath, destinationPath));
        }

        public override async IAsyncEnumerable<PreparedDocumentObjectInfo> ListObjectsAsync(
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!Directory.Exists(documentPath))
            {
                yield break;
            }

            foreach (var file in Directory.EnumerateFiles(documentPath, "*", SearchOption.AllDirectories))
            {
                cancellationToken.ThrowIfCancellationRequested();
                var relative = Path.GetRelativePath(documentPath, file).Replace(Path.DirectorySeparatorChar, '/');
                if (relative.StartsWith(PreparedDocumentFileNames.TempDirectoryName + "/", StringComparison.Ordinal))
                {
                    continue;
                }

                var info = new FileInfo(file);
                yield return new PreparedDocumentObjectInfo(new PreparedDocumentObjectName(relative), info.Length, info.LastWriteTimeUtc);
                await Task.Yield();
            }
        }

        private string GetObjectPath(PreparedDocumentObjectName name)
        {
            ValidateObjectName(name);
            return CombineUnderRoot(documentPath, name.Value);
        }
    }

    private sealed class FileReadLease(PreparedDocumentLockState lockState) : PreparedDocumentReadLease
    {
        private bool disposed;

        public override ValueTask DisposeAsync()
        {
            if (!disposed)
            {
                lock (lockState.SyncRoot)
                {
                    lockState.ActiveReaders--;
                }

                disposed = true;
            }

            return ValueTask.CompletedTask;
        }
    }

    private sealed class FileWriteLease(PreparedDocumentLockState lockState) : PreparedDocumentWriteLease
    {
        private bool disposed;

        public override ValueTask DisposeAsync()
        {
            if (!disposed)
            {
                lock (lockState.SyncRoot)
                {
                    lockState.WriterHeld = false;
                }

                disposed = true;
            }

            return ValueTask.CompletedTask;
        }
    }

    private sealed class FileObjectWriter(string tempPath, string destinationPath) : PreparedDocumentObjectWriter
    {
        private bool completed;
        private readonly FileStream stream = File.Open(tempPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);

        public override Stream Stream => stream;

        public override async ValueTask CommitAsync(CancellationToken cancellationToken = default)
        {
            if (completed)
            {
                return;
            }

            await stream.FlushAsync(cancellationToken);
            await stream.DisposeAsync();
            File.Move(tempPath, destinationPath, overwrite: true);
            completed = true;
        }

        public override async ValueTask AbortAsync(CancellationToken cancellationToken = default)
        {
            if (completed)
            {
                return;
            }

            await stream.DisposeAsync();
            if (File.Exists(tempPath))
            {
                File.Delete(tempPath);
            }

            completed = true;
        }

        public override async ValueTask DisposeAsync()
        {
            if (!completed)
            {
                await AbortAsync();
            }
        }
    }

    private sealed class BoundedReadStream(Stream inner, long remaining) : Stream
    {
        private long bytesRemaining = remaining;

        public override bool CanRead => inner.CanRead;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => bytesRemaining;
        public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }
        public override void Flush() { }
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        public override int Read(byte[] buffer, int offset, int count)
        {
            if (bytesRemaining <= 0)
            {
                return 0;
            }

            var read = inner.Read(buffer, offset, (int)Math.Min(count, bytesRemaining));
            bytesRemaining -= read;
            return read;
        }

        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            if (bytesRemaining <= 0)
            {
                return 0;
            }

            var read = await inner.ReadAsync(buffer[..(int)Math.Min(buffer.Length, bytesRemaining)], cancellationToken);
            bytesRemaining -= read;
            return read;
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                inner.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
