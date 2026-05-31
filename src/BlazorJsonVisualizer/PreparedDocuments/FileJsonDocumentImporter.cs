using System.Security.Cryptography;
using System.Text.Json;
using BlazorJsonVisualizer.Storage;

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
        var chunkSize = options.SourceChunkSizeBytes ?? store.SourceChunkSizeBytes;
        if (chunkSize <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(options), "Source chunk size must be greater than zero.");
        }

        PreparedDocumentContainer? container = null;
        PreparedDocumentWriteLease? writeLease = null;
        var createdAt = DateTimeOffset.UtcNow;

        try
        {
            container = await store.CreateContainerAsync(documentId, cancellationToken);
            writeLease = await container.AcquireWriteLeaseAsync(cancellationToken);

            await WriteManifestAsync(container, CreateManifest(documentId, createdAt, createdAt, 0, null, chunkSize, JsonDocumentPreparationState.Importing, options), cancellationToken);

            var importResult = await ImportSourceChunksAsync(source, container, chunkSize, cancellationToken);
            await ValidateJsonIfRequiredAsync(container, importResult.ChunkNames, options.AllowInvalidJson, cancellationToken);
            await WriteIndexArtifactsAsync(container, importResult, options, cancellationToken);

            var readyAt = DateTimeOffset.UtcNow;
            var manifest = CreateManifest(
                documentId,
                createdAt,
                readyAt,
                importResult.SourceLengthBytes,
                importResult.SourceHash,
                chunkSize,
                JsonDocumentPreparationState.Ready,
                options);

            await WriteManifestAsync(container, manifest, cancellationToken);

            return new PreparedJsonDocumentInfo(documentId, importResult.SourceLengthBytes, importResult.SourceHash, JsonDocumentPreparationState.Ready, createdAt);
        }
        catch
        {
            if (container is not null)
            {
                try
                {
                    await WriteManifestAsync(container, CreateManifest(documentId, createdAt, DateTimeOffset.UtcNow, 0, null, chunkSize, JsonDocumentPreparationState.Failed, options), CancellationToken.None);
                }
                catch
                {
                    // Best-effort failed-state marker before cleanup.
                }
            }

            await DisposeLeaseAsync(writeLease);
            TryDeleteDirectory(store.GetDocumentPath(documentId));
            throw;
        }
        finally
        {
            await DisposeLeaseAsync(writeLease);
        }
    }

    private static PreparedDocumentManifest CreateManifest(
        string documentId,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        long sourceLengthBytes,
        string? sourceHash,
        int chunkSize,
        JsonDocumentPreparationState state,
        JsonDocumentImportOptions options)
        => new()
        {
            DocumentId = documentId,
            SourceLength = sourceLengthBytes,
            SourceLengthBytes = sourceLengthBytes,
            SourceHash = sourceHash,
            SourceChunkSizeBytes = chunkSize,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
            LatestRevision = 1,
            State = state,
            Indexes = new PreparedDocumentManifestIndexes
            {
                Line = new PreparedDocumentManifestIndexEntry { State = state == JsonDocumentPreparationState.Ready ? PreparedDocumentIndexState.Ready : PreparedDocumentIndexState.Building },
                Structure = new PreparedDocumentManifestIndexEntry { State = state == JsonDocumentPreparationState.Ready ? PreparedDocumentIndexState.Ready : PreparedDocumentIndexState.Building },
                Search = new PreparedDocumentManifestIndexEntry { State = options.BuildSearchIndex && state == JsonDocumentPreparationState.Ready ? PreparedDocumentIndexState.Ready : PreparedDocumentIndexState.Missing },
                Path = new PreparedDocumentManifestIndexEntry { State = options.BuildPathIndex && state == JsonDocumentPreparationState.Ready ? PreparedDocumentIndexState.Ready : PreparedDocumentIndexState.Missing }
            },
            Transactions = new PreparedDocumentManifestTransactions
            {
                State = PreparedDocumentIndexState.Ready,
                Count = 0,
                LatestRevision = 1
            }
        };

    private static async ValueTask<ImportResult> ImportSourceChunksAsync(
        Stream source,
        PreparedDocumentContainer container,
        int chunkSize,
        CancellationToken cancellationToken)
    {
        using var sha256 = SHA256.Create();
        var buffer = new byte[Math.Min(chunkSize, 64 * 1024)];
        var lineOffsets = new List<long> { 0 };
        var chunkNames = new List<string>();
        var chunkLengths = new List<long>();
        long totalBytes = 0;
        var chunkIndex = 0;
        var bytesInChunk = 0;
        PreparedDocumentObjectWriter? chunkWriter = null;

        try
        {
            while (true)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var read = await source.ReadAsync(buffer, cancellationToken);
                if (read == 0)
                {
                    break;
                }

                var consumed = 0;
                while (consumed < read)
                {
                    if (chunkWriter is null)
                    {
                        var chunkName = $"source/chunks/{chunkIndex:D10}.chunk";
                        chunkNames.Add(chunkName);
                        chunkWriter = await container.CreateTemporaryObjectAsync(new PreparedDocumentObjectName(chunkName), cancellationToken);
                        bytesInChunk = 0;
                    }

                    var writable = Math.Min(read - consumed, chunkSize - bytesInChunk);
                    await chunkWriter.Stream.WriteAsync(buffer.AsMemory(consumed, writable), cancellationToken);
                    sha256.TransformBlock(buffer, consumed, writable, null, 0);
                    TrackLineOffsets(buffer.AsSpan(consumed, writable), totalBytes, lineOffsets);
                    totalBytes += writable;
                    bytesInChunk += writable;
                    consumed += writable;

                    if (bytesInChunk == chunkSize)
                    {
                        chunkLengths.Add(bytesInChunk);
                        await chunkWriter.CommitAsync(cancellationToken);
                        await chunkWriter.DisposeAsync();
                        chunkWriter = null;
                        chunkIndex++;
                    }
                }
            }

            if (chunkWriter is not null)
            {
                chunkLengths.Add(bytesInChunk);
                await chunkWriter.CommitAsync(cancellationToken);
                await chunkWriter.DisposeAsync();
            }

            sha256.TransformFinalBlock([], 0, 0);
            var hash = "sha256:" + Convert.ToHexString(sha256.Hash!).ToLowerInvariant();
            return new ImportResult(totalBytes, hash, chunkSize, chunkNames, chunkLengths, lineOffsets);
        }
        catch
        {
            if (chunkWriter is not null)
            {
                await chunkWriter.AbortAsync(CancellationToken.None);
                await chunkWriter.DisposeAsync();
            }

            throw;
        }
    }

    private static void TrackLineOffsets(ReadOnlySpan<byte> bytes, long baseOffset, List<long> lineOffsets)
    {
        for (var index = 0; index < bytes.Length; index++)
        {
            if (bytes[index] == (byte)'\n')
            {
                lineOffsets.Add(baseOffset + index + 1);
            }
        }
    }

    private static async ValueTask ValidateJsonIfRequiredAsync(
        PreparedDocumentContainer container,
        IReadOnlyList<string> chunkNames,
        bool allowInvalidJson,
        CancellationToken cancellationToken)
    {
        if (allowInvalidJson)
        {
            return;
        }

        await using var sourceStream = new ChunkSequenceReadStream(container, chunkNames, cancellationToken);
        try
        {
            await JsonDocument.ParseAsync(sourceStream, cancellationToken: cancellationToken);
        }
        catch (JsonException exception)
        {
            throw new InvalidDataException("Source stream is not valid JSON.", exception);
        }
    }

    private static async ValueTask WriteIndexArtifactsAsync(
        PreparedDocumentContainer container,
        ImportResult result,
        JsonDocumentImportOptions options,
        CancellationToken cancellationToken)
    {
        await FilePreparedJsonDocumentStore.WriteJsonObjectAsync(
            container,
            new PreparedDocumentObjectName(PreparedDocumentFileNames.SourceChunksIndexFileName),
            new { chunkSizeBytes = result.ChunkSizeBytes, chunks = result.ChunkNames.Select((name, i) => new { name, length = result.ChunkLengths[i] }).ToArray() },
            cancellationToken);

        await FilePreparedJsonDocumentStore.WriteJsonObjectAsync(
            container,
            new PreparedDocumentObjectName(PreparedDocumentFileNames.LineIndexFileName),
            new { version = 1, offsetKind = "utf8-byte", lineStartOffsets = result.LineStartOffsets },
            cancellationToken);

        await FilePreparedJsonDocumentStore.WriteJsonObjectAsync(
            container,
            new PreparedDocumentObjectName(PreparedDocumentFileNames.StructureIndexFileName),
            new { version = 1, offsetKind = "utf8-byte", state = "ready" },
            cancellationToken);

        await FilePreparedJsonDocumentStore.WriteJsonObjectAsync(
            container,
            new PreparedDocumentObjectName(PreparedDocumentFileNames.SearchIndexFileName),
            new { version = 1, state = options.BuildSearchIndex ? "ready" : "missing", scope = "literal-streaming" },
            cancellationToken);

        await FilePreparedJsonDocumentStore.WriteJsonObjectAsync(
            container,
            new PreparedDocumentObjectName(PreparedDocumentFileNames.PathIndexFileName),
            new { version = 1, state = options.BuildPathIndex ? "ready" : "missing" },
            cancellationToken);

        await FilePreparedJsonDocumentStore.WriteObjectAsync(
            container,
            new PreparedDocumentObjectName(PreparedDocumentFileNames.TransactionsFileName),
            async (stream, ct) =>
            {
                await using var writer = new StreamWriter(stream, leaveOpen: true);
                await writer.WriteLineAsync("{\"formatVersion\":1,\"transactions\":[]}".AsMemory(), ct);
            },
            cancellationToken);
    }

    private static ValueTask WriteManifestAsync(PreparedDocumentContainer container, PreparedDocumentManifest manifest, CancellationToken cancellationToken)
        => FilePreparedJsonDocumentStore.WriteJsonObjectAsync(container, new PreparedDocumentObjectName(PreparedDocumentFileNames.ManifestFileName), manifest, cancellationToken);

    private static async ValueTask DisposeLeaseAsync(PreparedDocumentWriteLease? lease)
    {
        if (lease is not null)
        {
            await lease.DisposeAsync();
        }
    }

    private static void TryDeleteDirectory(string path)
    {
        if (Directory.Exists(path))
        {
            try
            {
                Directory.Delete(path, recursive: true);
            }
            catch
            {
                // Best-effort cleanup for failed imports.
            }
        }
    }

    private sealed record ImportResult(
        long SourceLengthBytes,
        string SourceHash,
        int ChunkSizeBytes,
        IReadOnlyList<string> ChunkNames,
        IReadOnlyList<long> ChunkLengths,
        IReadOnlyList<long> LineStartOffsets);
}
