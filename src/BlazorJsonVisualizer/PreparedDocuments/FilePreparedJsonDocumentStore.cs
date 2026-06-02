using System.Text.Json;
using BlazorJsonVisualizer.Protocol;
using BlazorJsonVisualizer.Storage;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class FilePreparedJsonDocumentStore : IPreparedJsonDocumentStore
{
    internal static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    private readonly FilePreparedDocumentStorageProvider provider;

    public FilePreparedJsonDocumentStore(string rootPath)
        : this(new FilePreparedDocumentStorageOptions { RootDirectory = rootPath })
    {
    }

    public FilePreparedJsonDocumentStore(FilePreparedDocumentStorageOptions options)
    {
        provider = new FilePreparedDocumentStorageProvider(options);
        RootPath = provider.RootDirectory;
        SourceChunkSizeBytes = options.SourceChunkSizeBytes;
    }

    public string RootPath { get; }

    internal int SourceChunkSizeBytes { get; }

    internal IPreparedDocumentStorageProvider StorageProvider => provider;

    public async ValueTask<PreparedJsonDocumentInfo?> GetAsync(string documentId, CancellationToken cancellationToken = default)
    {
        var container = await provider.TryOpenContainerAsync(documentId, cancellationToken);
        if (container is null || !await container.ObjectExistsAsync(new PreparedDocumentObjectName(PreparedDocumentFileNames.ManifestFileName), cancellationToken))
        {
            return null;
        }

        var manifest = await ReadManifestAsync(container, cancellationToken);
        if (manifest.FormatVersion != 1)
        {
            throw new InvalidDataException($"Prepared document '{documentId}' uses unsupported storage format version {manifest.FormatVersion}.");
        }

        if (manifest.State != JsonDocumentPreparationState.Ready)
        {
            return null;
        }

        return ToInfo(manifest);
    }

    public async ValueTask<IReadOnlyList<PreparedJsonDocumentInfo>> ListAsync(CancellationToken cancellationToken = default)
    {
        var documentInfos = new List<PreparedJsonDocumentInfo>();
        await foreach (var containerInfo in provider.ListContainersAsync(cancellationToken))
        {
            var info = await GetAsync(containerInfo.DocumentId, cancellationToken);
            if (info is not null)
            {
                documentInfos.Add(info);
            }
        }

        return documentInfos
            .OrderByDescending(static info => info.CreatedAt)
            .ToArray();
    }

    public async ValueTask<PreparedJsonDocumentHandle> OpenAsync(string documentId, CancellationToken cancellationToken = default)
    {
        var container = await provider.TryOpenContainerAsync(documentId, cancellationToken)
            ?? throw new FileNotFoundException($"Prepared document '{documentId}' does not exist.");
        var manifest = await ReadManifestAsync(container, cancellationToken);
        if (manifest.FormatVersion != 1)
        {
            throw new InvalidDataException($"Prepared document '{documentId}' uses unsupported storage format version {manifest.FormatVersion}.");
        }

        if (manifest.State != JsonDocumentPreparationState.Ready)
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' is not ready.");
        }

        var lease = await container.AcquireReadLeaseAsync(cancellationToken);
        return new PreparedJsonDocumentHandle(container, lease, manifest);
    }


    public async ValueTask AppendTransactionAsync(string documentId, PreparedDocumentTransactionDto transaction, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        ArgumentNullException.ThrowIfNull(transaction);

        var container = await provider.TryOpenContainerAsync(documentId, cancellationToken)
            ?? throw new FileNotFoundException($"Prepared document '{documentId}' does not exist.");
        var manifest = await ReadManifestAsync(container, cancellationToken);
        if (manifest.LatestRevision != transaction.BaseRevision || transaction.Revision != transaction.BaseRevision + 1)
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' expected transaction base revision {manifest.LatestRevision} but received {transaction.BaseRevision}.");
        }

        var existing = await ReadTransactionLogAsync(container, cancellationToken);
        existing.Add(transaction);
        await WriteJsonObjectAsync(container, new PreparedDocumentObjectName(PreparedDocumentFileNames.TransactionsFileName), new PreparedTransactionLogDto(1, existing), cancellationToken);

        var updatedManifest = manifest with
        {
            UpdatedAt = DateTimeOffset.UtcNow,
            LatestRevision = (int)transaction.Revision,
            Indexes = manifest.Indexes with
            {
                Structure = manifest.Indexes.Structure with { State = PreparedDocumentIndexState.Stale },
                Search = manifest.Indexes.Search with { State = PreparedDocumentIndexState.Stale },
                Path = manifest.Indexes.Path with { State = PreparedDocumentIndexState.Stale }
            },
            Transactions = manifest.Transactions with
            {
                Count = existing.Count,
                LatestRevision = (int)transaction.Revision,
                State = PreparedDocumentIndexState.Ready
            }
        };
        await WriteJsonObjectAsync(container, new PreparedDocumentObjectName(PreparedDocumentFileNames.ManifestFileName), updatedManifest, cancellationToken);
    }

    public ValueTask DeleteAsync(string documentId, CancellationToken cancellationToken = default)
        => provider.DeleteContainerAsync(documentId, cancellationToken);

    internal ValueTask<PreparedDocumentContainer> CreateContainerAsync(string documentId, CancellationToken cancellationToken)
        => provider.CreateContainerAsync(documentId, cancellationToken);

    internal string GetDocumentPath(string documentId) => provider.GetDocumentPath(documentId);

    internal static async ValueTask WriteObjectAsync(
        PreparedDocumentContainer container,
        PreparedDocumentObjectName name,
        Func<Stream, CancellationToken, ValueTask> write,
        CancellationToken cancellationToken)
    {
        await using var writer = await container.CreateTemporaryObjectAsync(name, cancellationToken);
        try
        {
            await write(writer.Stream, cancellationToken);
            await writer.CommitAsync(cancellationToken);
        }
        catch
        {
            await writer.AbortAsync(cancellationToken);
            throw;
        }
    }

    internal static ValueTask WriteJsonObjectAsync<T>(PreparedDocumentContainer container, PreparedDocumentObjectName name, T value, CancellationToken cancellationToken)
        => WriteObjectAsync(
            container,
            name,
            async (stream, ct) => await JsonSerializer.SerializeAsync(stream, value, JsonOptions, ct),
            cancellationToken);

    internal static async ValueTask<PreparedDocumentManifest> ReadManifestAsync(
        PreparedDocumentContainer container,
        CancellationToken cancellationToken)
    {
        await using var manifestStream = await container.OpenReadAsync(new PreparedDocumentObjectName(PreparedDocumentFileNames.ManifestFileName), cancellationToken);
        var manifest = await JsonSerializer.DeserializeAsync<PreparedDocumentManifest>(manifestStream, JsonOptions, cancellationToken);
        if (manifest is null)
        {
            throw new InvalidDataException($"Manifest for prepared document '{container.DocumentId}' is invalid.");
        }

        return manifest;
    }


    private static async ValueTask<List<PreparedDocumentTransactionDto>> ReadTransactionLogAsync(PreparedDocumentContainer container, CancellationToken cancellationToken)
    {
        if (!await container.ObjectExistsAsync(new PreparedDocumentObjectName(PreparedDocumentFileNames.TransactionsFileName), cancellationToken))
        {
            return [];
        }

        await using var stream = await container.OpenReadAsync(new PreparedDocumentObjectName(PreparedDocumentFileNames.TransactionsFileName), cancellationToken);
        var log = await JsonSerializer.DeserializeAsync<PreparedTransactionLogDto>(stream, JsonOptions, cancellationToken);
        return log?.Transactions?.ToList() ?? [];
    }

    private sealed record PreparedTransactionLogDto(int FormatVersion, IReadOnlyList<PreparedDocumentTransactionDto> Transactions);

    private static PreparedJsonDocumentInfo ToInfo(PreparedDocumentManifest manifest)
        => new(
            manifest.DocumentId,
            manifest.SourceLengthBytes == 0 ? manifest.SourceLength : manifest.SourceLengthBytes,
            manifest.SourceHash,
            manifest.State,
            manifest.CreatedAt);
}
