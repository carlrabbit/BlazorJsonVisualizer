using System.Text.Json;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class FilePreparedJsonDocumentStore : IPreparedJsonDocumentStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    public FilePreparedJsonDocumentStore(string rootPath)
    {
        if (string.IsNullOrWhiteSpace(rootPath))
        {
            throw new ArgumentException("Root path is required.", nameof(rootPath));
        }

        RootPath = rootPath;
        Directory.CreateDirectory(RootPath);
    }

    public string RootPath { get; }

    public ValueTask<PreparedJsonDocumentInfo?> GetAsync(string documentId, CancellationToken cancellationToken = default)
        => GetCoreAsync(documentId, cancellationToken);

    public async ValueTask<IReadOnlyList<PreparedJsonDocumentInfo>> ListAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var documentInfos = new List<PreparedJsonDocumentInfo>();
        foreach (var directory in Directory.EnumerateDirectories(RootPath))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var documentId = Path.GetFileName(directory);
            var info = await GetCoreAsync(documentId, cancellationToken);
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
        cancellationToken.ThrowIfCancellationRequested();
        var documentPath = GetDocumentPath(documentId);
        var manifestPath = GetManifestPath(documentId);

        if (!Directory.Exists(documentPath) || !File.Exists(manifestPath))
        {
            throw new FileNotFoundException($"Prepared document '{documentId}' does not exist.", manifestPath);
        }

        var manifest = await ReadManifestAsync(manifestPath, cancellationToken);
        return new PreparedJsonDocumentHandle(documentId, documentPath, manifest);
    }

    public ValueTask DeleteAsync(string documentId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var documentPath = GetDocumentPath(documentId);
        if (Directory.Exists(documentPath))
        {
            Directory.Delete(documentPath, recursive: true);
        }

        return ValueTask.CompletedTask;
    }

    internal string GetDocumentPath(string documentId) => Path.Combine(RootPath, documentId);

    internal string GetManifestPath(string documentId) => Path.Combine(GetDocumentPath(documentId), PreparedDocumentFileNames.ManifestFileName);

    internal async ValueTask WriteManifestAsync(string documentId, PreparedDocumentManifest manifest, CancellationToken cancellationToken)
    {
        var manifestPath = GetManifestPath(documentId);
        await using var manifestStream = File.Create(manifestPath);
        await JsonSerializer.SerializeAsync(manifestStream, manifest, JsonOptions, cancellationToken);
    }

    private async ValueTask<PreparedJsonDocumentInfo?> GetCoreAsync(string documentId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var manifestPath = GetManifestPath(documentId);
        if (!File.Exists(manifestPath))
        {
            return null;
        }

        var manifest = await ReadManifestAsync(manifestPath, cancellationToken);
        return new PreparedJsonDocumentInfo(
            manifest.DocumentId,
            manifest.SourceLength,
            manifest.SourceHash,
            manifest.State,
            manifest.CreatedAt);
    }

    private static async ValueTask<PreparedDocumentManifest> ReadManifestAsync(string manifestPath, CancellationToken cancellationToken)
    {
        await using var manifestStream = File.OpenRead(manifestPath);
        var manifest = await JsonSerializer.DeserializeAsync<PreparedDocumentManifest>(
            manifestStream,
            JsonOptions,
            cancellationToken: cancellationToken);
        if (manifest is null)
        {
            throw new InvalidDataException($"Manifest file '{manifestPath}' is invalid.");
        }

        return manifest;
    }
}
