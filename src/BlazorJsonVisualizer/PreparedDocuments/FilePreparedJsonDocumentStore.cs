using System.Text.Json;
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

    private static PreparedJsonDocumentInfo ToInfo(PreparedDocumentManifest manifest)
        => new(
            manifest.DocumentId,
            manifest.SourceLengthBytes == 0 ? manifest.SourceLength : manifest.SourceLengthBytes,
            manifest.SourceHash,
            manifest.State,
            manifest.CreatedAt);
}
