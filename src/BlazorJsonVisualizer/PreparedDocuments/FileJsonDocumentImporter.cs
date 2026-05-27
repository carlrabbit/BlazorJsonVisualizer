using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class FileJsonDocumentImporter(FilePreparedJsonDocumentStore store) : IJsonDocumentImporter
{
    public async ValueTask<PreparedJsonDocumentInfo> ImportAsync(
        Stream source,
        JsonDocumentImportOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(options);

        if (!source.CanRead)
        {
            throw new InvalidOperationException("Source stream must be readable.");
        }

        var documentId = string.IsNullOrWhiteSpace(options.DocumentId)
            ? Guid.NewGuid().ToString("n")
            : options.DocumentId;

        var documentPath = store.GetDocumentPath(documentId);
        if (Directory.Exists(documentPath))
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' already exists.");
        }

        Directory.CreateDirectory(documentPath);
        var createdAt = DateTimeOffset.UtcNow;

        try
        {
            var sourcePath = Path.Combine(documentPath, PreparedDocumentFileNames.SourceFileName);
            var (sourceLength, sourceHash) = await CopySourceWithHashAsync(source, sourcePath, cancellationToken);

            await ValidateJsonIfRequiredAsync(sourcePath, options.AllowInvalidJson, cancellationToken);
            await WritePlaceholderArtifactsAsync(documentPath, options, cancellationToken);

            var manifest = new PreparedDocumentManifest
            {
                DocumentId = documentId,
                SourceLength = sourceLength,
                SourceHash = sourceHash,
                CreatedAt = createdAt,
                LatestRevision = 1,
                State = JsonDocumentPreparationState.Ready,
                Indexes = new PreparedDocumentManifestIndexes
                {
                    Structure = new PreparedDocumentManifestIndexEntry { State = PreparedDocumentIndexState.Ready },
                    Search = new PreparedDocumentManifestIndexEntry
                    {
                        State = options.BuildSearchIndex ? PreparedDocumentIndexState.Ready : PreparedDocumentIndexState.Missing
                    },
                    Path = new PreparedDocumentManifestIndexEntry
                    {
                        State = options.BuildPathIndex ? PreparedDocumentIndexState.Ready : PreparedDocumentIndexState.Missing
                    }
                },
                Transactions = new PreparedDocumentManifestTransactions
                {
                    Count = 0,
                    LatestRevision = 1
                }
            };

            await store.WriteManifestAsync(documentId, manifest, cancellationToken);

            return new PreparedJsonDocumentInfo(
                documentId,
                sourceLength,
                sourceHash,
                JsonDocumentPreparationState.Ready,
                createdAt);
        }
        catch
        {
            TryDeleteDirectory(documentPath);
            throw;
        }
    }

    private static async ValueTask<(long SourceLength, string SourceHash)> CopySourceWithHashAsync(
        Stream source,
        string destinationPath,
        CancellationToken cancellationToken)
    {
        await using var destination = File.Create(destinationPath);
        using var sha256 = SHA256.Create();
        var buffer = new byte[16 * 1024];
        long totalBytes = 0;

        while (true)
        {
            var bytesRead = await source.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken);
            if (bytesRead == 0)
            {
                break;
            }

            await destination.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
            sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
            totalBytes += bytesRead;
        }

        sha256.TransformFinalBlock([], 0, 0);
        var hashHex = Convert.ToHexString(sha256.Hash!);
        return (totalBytes, hashHex);
    }

    private static async ValueTask ValidateJsonIfRequiredAsync(string sourcePath, bool allowInvalidJson, CancellationToken cancellationToken)
    {
        if (allowInvalidJson)
        {
            return;
        }

        await using var sourceStream = File.OpenRead(sourcePath);
        try
        {
            await JsonDocument.ParseAsync(sourceStream, cancellationToken: cancellationToken);
        }
        catch (JsonException jsonException)
        {
            throw new InvalidDataException("Source stream is not valid JSON.", jsonException);
        }
    }

    private static async ValueTask WritePlaceholderArtifactsAsync(
        string documentPath,
        JsonDocumentImportOptions options,
        CancellationToken cancellationToken)
    {
        await File.WriteAllTextAsync(
            Path.Combine(documentPath, PreparedDocumentFileNames.StructureIndexFileName),
            "{\"state\":\"ready\"}",
            Encoding.UTF8,
            cancellationToken);

        await File.WriteAllTextAsync(
            Path.Combine(documentPath, PreparedDocumentFileNames.SearchIndexFileName),
            options.BuildSearchIndex ? "{\"state\":\"ready\"}" : "{\"state\":\"missing\"}",
            Encoding.UTF8,
            cancellationToken);

        await File.WriteAllTextAsync(
            Path.Combine(documentPath, PreparedDocumentFileNames.PathIndexFileName),
            options.BuildPathIndex ? "{\"state\":\"ready\"}" : "{\"state\":\"missing\"}",
            Encoding.UTF8,
            cancellationToken);

        await File.WriteAllTextAsync(
            Path.Combine(documentPath, PreparedDocumentFileNames.TransactionsFileName),
            "{\"formatVersion\":1,\"transactions\":[]}",
            Encoding.UTF8,
            cancellationToken);
    }

    private static void TryDeleteDirectory(string directoryPath)
    {
        if (!Directory.Exists(directoryPath))
        {
            return;
        }

        try
        {
            Directory.Delete(directoryPath, recursive: true);
        }
        catch
        {
            // Ignore cleanup failure after import failure.
        }
    }
}
