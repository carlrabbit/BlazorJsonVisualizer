using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.Json;
using BlazorJsonVisualizer.PreparedDocuments;
using BlazorJsonVisualizer.Storage;
using BlazorJsonVisualizer.Storage.EFCore.Entities;
using Microsoft.EntityFrameworkCore;

namespace BlazorJsonVisualizer.Storage.EFCore;

public sealed class EfCorePreparedJsonDocumentStore<TContext> : IPreparedJsonDocumentStore
    where TContext : DbContext, IBlazorJsonVisualizerStorageDbContext
{
    public const int DefaultChunkSizeBytes = 1024 * 1024;
    private static readonly ConcurrentDictionary<string, int> ActiveReadLeases = new(StringComparer.Ordinal);
    private readonly IDbContextFactory<TContext>? contextFactory;
    private readonly Func<TContext>? contextProvider;

    public EfCorePreparedJsonDocumentStore(IDbContextFactory<TContext> contextFactory)
    {
        ArgumentNullException.ThrowIfNull(contextFactory);
        this.contextFactory = contextFactory;
    }

    internal EfCorePreparedJsonDocumentStore(Func<TContext> contextProvider)
    {
        ArgumentNullException.ThrowIfNull(contextProvider);
        this.contextProvider = contextProvider;
    }

    internal TContext CreateContext() =>
        contextFactory is not null
            ? contextFactory.CreateDbContext()
            : contextProvider!();

    public async ValueTask<PreparedJsonDocumentInfo?> GetAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);

        await using var context = CreateContext();
        var entity = await context.PreparedJsonDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.DocumentId == documentId, cancellationToken);
        if (entity is null || entity.State != nameof(JsonDocumentPreparationState.Ready))
        {
            return null;
        }

        return ToInfo(entity);
    }

    public async ValueTask<IReadOnlyList<PreparedJsonDocumentInfo>> ListAsync(CancellationToken cancellationToken = default)
    {
        await using var context = CreateContext();
        var entities = await context.PreparedJsonDocuments
            .AsNoTracking()
            .Where(e => e.State == nameof(JsonDocumentPreparationState.Ready))
            .ToListAsync(cancellationToken);
        entities = [.. entities.OrderByDescending(e => e.CreatedAt)];
        return entities.Select(ToInfo).ToArray();
    }

    public async ValueTask<PreparedJsonDocumentHandle> OpenAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);

        await using var context = CreateContext();
        var entity = await context.PreparedJsonDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.DocumentId == documentId, cancellationToken)
            ?? throw new InvalidOperationException($"Prepared document '{documentId}' does not exist. Diagnostic: {EfCoreStorageDiagnostics.DocumentNotFound}");

        if (entity.FormatVersion != 1)
        {
            throw new InvalidDataException($"Prepared document '{documentId}' uses unsupported storage format version {entity.FormatVersion}. Diagnostic: {EfCoreStorageDiagnostics.UnsupportedStorageFormatVersion}");
        }

        if (entity.State != nameof(JsonDocumentPreparationState.Ready))
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' is not ready (state: {entity.State}). Diagnostic: {EfCoreStorageDiagnostics.InvalidDocumentState}");
        }

        var manifest = ToManifest(entity);
        var container = new EfCorePreparedDocumentContainer<TContext>(documentId, CreateContext, ReleaseReadLease);
        var lease = await container.AcquireReadLeaseAsync(cancellationToken);
        return new PreparedJsonDocumentHandle(container, lease, manifest);
    }

    public async ValueTask DeleteAsync(string documentId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        if (HasActiveReadLease(documentId))
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' cannot be deleted because it has active handles.");
        }

        await using var context = CreateContext();

        await context.PreparedJsonDocumentSourceChunks.Where(e => e.DocumentId == documentId).ExecuteDeleteAsync(cancellationToken);
        await context.PreparedJsonDocumentIndexArtifacts.Where(e => e.DocumentId == documentId).ExecuteDeleteAsync(cancellationToken);
        await context.PreparedJsonDocumentStructuralNodes.Where(e => e.DocumentId == documentId).ExecuteDeleteAsync(cancellationToken);
        await context.PreparedJsonDocumentSearchEntries.Where(e => e.DocumentId == documentId).ExecuteDeleteAsync(cancellationToken);
        await context.PreparedJsonDocumentTransactions.Where(e => e.DocumentId == documentId).ExecuteDeleteAsync(cancellationToken);
        await context.PreparedJsonDocumentDiagnostics.Where(e => e.DocumentId == documentId).ExecuteDeleteAsync(cancellationToken);
        await context.PreparedJsonDocumentImportJobs.Where(e => e.DocumentId == documentId).ExecuteDeleteAsync(cancellationToken);
        await context.PreparedJsonDocuments.Where(e => e.DocumentId == documentId).ExecuteDeleteAsync(cancellationToken);
    }

    internal async ValueTask<string> ImportAsync(
        Stream source,
        string documentId,
        int chunkSizeBytes,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentException.ThrowIfNullOrEmpty(documentId);
        if (!source.CanRead)
        {
            throw new InvalidOperationException("Source stream must be readable.");
        }

        if (chunkSizeBytes <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(chunkSizeBytes), "Chunk size must be greater than zero.");
        }

        await using var context = CreateContext();

        var existing = await context.PreparedJsonDocuments
            .AsNoTracking()
            .AnyAsync(e => e.DocumentId == documentId, cancellationToken);
        if (existing)
        {
            throw new InvalidOperationException($"Prepared document '{documentId}' already exists. Diagnostic: {EfCoreStorageDiagnostics.DuplicateDocumentId}");
        }

        var now = DateTimeOffset.UtcNow;
        var document = new PreparedJsonDocumentEntity
        {
            DocumentId = documentId,
            FormatVersion = 1,
            State = nameof(JsonDocumentPreparationState.Importing),
            SourceChunkSizeBytes = chunkSizeBytes,
            CreatedAt = now,
            UpdatedAt = now,
            LatestRevision = 1,
            TransactionLatestRevision = 1,
            TransactionState = nameof(PreparedDocumentIndexState.Ready)
        };
        context.PreparedJsonDocuments.Add(document);
        await context.SaveChangesAsync(cancellationToken);

        long totalBytes = 0;
        var chunkIndex = 0;
        var buffer = new byte[chunkSizeBytes];
        var lineStartOffsets = new List<long> { 0 };
        using var hasher = SHA256.Create();

        try
        {
            while (true)
            {
                var bytesRead = 0;
                while (bytesRead < chunkSizeBytes)
                {
                    var read = await source.ReadAsync(buffer.AsMemory(bytesRead, chunkSizeBytes - bytesRead), cancellationToken);
                    if (read == 0)
                    {
                        break;
                    }

                    TrackLineOffsets(buffer.AsSpan(bytesRead, read), totalBytes + bytesRead, lineStartOffsets);
                    bytesRead += read;
                }

                if (bytesRead == 0)
                {
                    break;
                }

                hasher.TransformBlock(buffer, 0, bytesRead, null, 0);

                context.PreparedJsonDocumentSourceChunks.Add(new PreparedJsonDocumentSourceChunkEntity
                {
                    DocumentId = documentId,
                    ChunkIndex = chunkIndex,
                    StartByteOffset = totalBytes,
                    LengthBytes = bytesRead,
                    Content = buffer[..bytesRead]
                });

                totalBytes += bytesRead;
                chunkIndex++;
            }

            hasher.TransformFinalBlock([], 0, 0);
            var sourceHash = Convert.ToHexString(hasher.Hash!).ToLowerInvariant();

            context.PreparedJsonDocumentIndexArtifacts.AddRange(
                CreateArtifact(documentId, PreparedDocumentFileNames.LineIndexFileName, new { version = 1, offsetKind = "utf8-byte", lineStartOffsets }, now),
                CreateArtifact(documentId, PreparedDocumentFileNames.StructureIndexFileName, new { version = 1, offsetKind = "utf8-byte", state = "ready" }, now),
                CreateArtifact(documentId, PreparedDocumentFileNames.SearchIndexFileName, new { version = 1, state = "missing", scope = "literal-streaming" }, now),
                CreateArtifact(documentId, PreparedDocumentFileNames.PathIndexFileName, new { version = 1, state = "missing" }, now));

            await context.SaveChangesAsync(cancellationToken);

            await context.PreparedJsonDocuments
                .Where(e => e.DocumentId == documentId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.State, nameof(JsonDocumentPreparationState.Ready))
                    .SetProperty(e => e.SourceLengthBytes, totalBytes)
                    .SetProperty(e => e.SourceHash, sourceHash)
                    .SetProperty(e => e.UpdatedAt, DateTimeOffset.UtcNow)
                    .SetProperty(e => e.LineIndexState, nameof(PreparedDocumentIndexState.Ready))
                    .SetProperty(e => e.StructureIndexState, nameof(PreparedDocumentIndexState.Ready))
                    .SetProperty(e => e.SearchIndexState, nameof(PreparedDocumentIndexState.Missing))
                    .SetProperty(e => e.PathIndexState, nameof(PreparedDocumentIndexState.Missing)),
                    cancellationToken);

            return documentId;
        }
        catch
        {
            await context.PreparedJsonDocumentSourceChunks
                .Where(e => e.DocumentId == documentId)
                .ExecuteDeleteAsync(CancellationToken.None);
            await context.PreparedJsonDocumentIndexArtifacts
                .Where(e => e.DocumentId == documentId)
                .ExecuteDeleteAsync(CancellationToken.None);
            await context.PreparedJsonDocuments
                .Where(e => e.DocumentId == documentId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.State, nameof(JsonDocumentPreparationState.Failed))
                    .SetProperty(e => e.UpdatedAt, DateTimeOffset.UtcNow), CancellationToken.None);
            throw;
        }
    }

    private static PreparedJsonDocumentIndexArtifactEntity CreateArtifact(string documentId, string indexName, object payload, DateTimeOffset createdAt)
        => new()
        {
            DocumentId = documentId,
            IndexName = indexName,
            Revision = 1,
            Payload = JsonSerializer.SerializeToUtf8Bytes(payload),
            CreatedAt = createdAt
        };

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

    private static PreparedJsonDocumentInfo ToInfo(PreparedJsonDocumentEntity entity) =>
        new(
            entity.DocumentId,
            entity.SourceLengthBytes,
            entity.SourceHash,
            Enum.TryParse<JsonDocumentPreparationState>(entity.State, out var state) ? state : JsonDocumentPreparationState.Failed,
            entity.CreatedAt);

    private static PreparedDocumentManifest ToManifest(PreparedJsonDocumentEntity entity) =>
        new()
        {
            FormatVersion = entity.FormatVersion,
            DocumentId = entity.DocumentId,
            SourceLength = entity.SourceLengthBytes,
            SourceLengthBytes = entity.SourceLengthBytes,
            SourceHash = entity.SourceHash,
            SourceEncoding = entity.SourceEncoding,
            SourceChunkSizeBytes = entity.SourceChunkSizeBytes,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            LatestRevision = entity.LatestRevision,
            State = Enum.TryParse<JsonDocumentPreparationState>(entity.State, out var state) ? state : JsonDocumentPreparationState.Failed,
            Indexes = new PreparedDocumentManifestIndexes
            {
                Line = new PreparedDocumentManifestIndexEntry { State = ParseIndexState(entity.LineIndexState) },
                Structure = new PreparedDocumentManifestIndexEntry { State = ParseIndexState(entity.StructureIndexState) },
                Search = new PreparedDocumentManifestIndexEntry { State = ParseIndexState(entity.SearchIndexState) },
                Path = new PreparedDocumentManifestIndexEntry { State = ParseIndexState(entity.PathIndexState) }
            },
            Transactions = new PreparedDocumentManifestTransactions
            {
                State = ParseIndexState(entity.TransactionState),
                Count = entity.TransactionCount,
                LatestRevision = entity.TransactionLatestRevision
            }
        };

    private static PreparedDocumentIndexState ParseIndexState(string state) =>
        Enum.TryParse<PreparedDocumentIndexState>(state, out var result) ? result : PreparedDocumentIndexState.Missing;

    private static bool HasActiveReadLease(string documentId)
        => ActiveReadLeases.TryGetValue(documentId, out var count) && count > 0;

    internal static void AddReadLease(string documentId)
        => ActiveReadLeases.AddOrUpdate(documentId, 1, static (_, current) => current + 1);

    private static void ReleaseReadLease(string documentId)
    {
        while (true)
        {
            if (!ActiveReadLeases.TryGetValue(documentId, out var current))
            {
                return;
            }

            if (current <= 1)
            {
                if (ActiveReadLeases.TryRemove(documentId, out _))
                {
                    return;
                }

                continue;
            }

            if (ActiveReadLeases.TryUpdate(documentId, current - 1, current))
            {
                return;
            }
        }
    }

    private sealed class EfCorePreparedDocumentContainer<TDbContext>(
        string documentId,
        Func<TDbContext> createContext,
        Action<string> releaseReadLease) : PreparedDocumentContainer
        where TDbContext : DbContext, IBlazorJsonVisualizerStorageDbContext
    {
        public override string DocumentId => documentId;

        public override ValueTask<PreparedDocumentReadLease> AcquireReadLeaseAsync(CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            AddReadLease(documentId);
            return ValueTask.FromResult<PreparedDocumentReadLease>(new EfCorePreparedDocumentReadLease(documentId, releaseReadLease));
        }

        public override ValueTask<PreparedDocumentWriteLease> AcquireWriteLeaseAsync(CancellationToken cancellationToken = default)
            => throw new NotSupportedException("EF Core prepared-document containers do not expose direct write leases.");

        public override async ValueTask<bool> ObjectExistsAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default)
        {
            await using var context = createContext();

            if (TryParseSourceChunkName(name.Value, out var chunkIndex))
            {
                return await context.PreparedJsonDocumentSourceChunks
                    .AsNoTracking()
                    .AnyAsync(e => e.DocumentId == documentId && e.ChunkIndex == chunkIndex, cancellationToken);
            }

            if (name.Value == PreparedDocumentFileNames.TransactionsFileName)
            {
                return await context.PreparedJsonDocuments.AsNoTracking().AnyAsync(e => e.DocumentId == documentId, cancellationToken);
            }

            if (name.Value == PreparedDocumentFileNames.ManifestFileName)
            {
                return await context.PreparedJsonDocuments.AsNoTracking().AnyAsync(e => e.DocumentId == documentId, cancellationToken);
            }

            return await context.PreparedJsonDocumentIndexArtifacts
                .AsNoTracking()
                .AnyAsync(e => e.DocumentId == documentId && e.IndexName == name.Value, cancellationToken);
        }

        public override async ValueTask<Stream> OpenReadAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default)
        {
            await using var context = createContext();

            if (TryParseSourceChunkName(name.Value, out var chunkIndex))
            {
                var chunk = await context.PreparedJsonDocumentSourceChunks
                    .AsNoTracking()
                    .Where(e => e.DocumentId == documentId && e.ChunkIndex == chunkIndex)
                    .Select(e => e.Content)
                    .SingleOrDefaultAsync(cancellationToken)
                    ?? throw new FileNotFoundException($"Prepared document artifact '{name}' is missing. Diagnostic: {EfCoreStorageDiagnostics.MissingArtifact}");
                return new MemoryStream(chunk, writable: false);
            }

            if (name.Value == PreparedDocumentFileNames.TransactionsFileName)
            {
                var payload = await BuildTransactionsPayloadAsync(context, cancellationToken);
                return new MemoryStream(payload, writable: false);
            }

            if (name.Value == PreparedDocumentFileNames.ManifestFileName)
            {
                var document = await context.PreparedJsonDocuments
                    .AsNoTracking()
                    .SingleOrDefaultAsync(e => e.DocumentId == documentId, cancellationToken)
                    ?? throw new FileNotFoundException($"Prepared document '{documentId}' does not exist. Diagnostic: {EfCoreStorageDiagnostics.DocumentNotFound}");
                var manifest = JsonSerializer.SerializeToUtf8Bytes(ToManifest(document));
                return new MemoryStream(manifest, writable: false);
            }

            var artifact = await context.PreparedJsonDocumentIndexArtifacts
                .AsNoTracking()
                .Where(e => e.DocumentId == documentId && e.IndexName == name.Value)
                .Select(e => e.Payload)
                .SingleOrDefaultAsync(cancellationToken)
                ?? throw new FileNotFoundException($"Prepared document artifact '{name}' is missing. Diagnostic: {EfCoreStorageDiagnostics.MissingArtifact}");
            return new MemoryStream(artifact, writable: false);
        }

        public override async ValueTask<Stream> OpenRangeReadAsync(PreparedDocumentObjectName name, long startOffset, long length, CancellationToken cancellationToken = default)
        {
            if (startOffset < 0 || length < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(startOffset), "Range offsets must be non-negative.");
            }

            await using var stream = await OpenReadAsync(name, cancellationToken);
            if (startOffset > stream.Length)
            {
                throw new ArgumentOutOfRangeException(nameof(startOffset), "Range start is beyond the source length.");
            }

            var boundedLength = (int)Math.Min(length, stream.Length - startOffset);
            var buffer = new byte[boundedLength];
            stream.Position = startOffset;
            await stream.ReadExactlyAsync(buffer, 0, boundedLength, cancellationToken);
            return new MemoryStream(buffer, writable: false);
        }

        public override ValueTask<PreparedDocumentObjectWriter> CreateTemporaryObjectAsync(PreparedDocumentObjectName name, CancellationToken cancellationToken = default)
            => throw new NotSupportedException("EF Core prepared-document containers do not expose temporary object writers.");

        public override async IAsyncEnumerable<PreparedDocumentObjectInfo> ListObjectsAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            await using var context = createContext();
            var document = await context.PreparedJsonDocuments
                .AsNoTracking()
                .SingleOrDefaultAsync(e => e.DocumentId == documentId, cancellationToken);
            if (document is null)
            {
                yield break;
            }

            yield return new PreparedDocumentObjectInfo(new PreparedDocumentObjectName(PreparedDocumentFileNames.ManifestFileName), 0, document.UpdatedAt);

            var chunks = await context.PreparedJsonDocumentSourceChunks
                .AsNoTracking()
                .Where(e => e.DocumentId == documentId)
                .OrderBy(e => e.ChunkIndex)
                .Select(e => new { e.ChunkIndex, e.LengthBytes })
                .ToListAsync(cancellationToken);
            foreach (var chunk in chunks)
            {
                yield return new PreparedDocumentObjectInfo(new PreparedDocumentObjectName($"source/chunks/{chunk.ChunkIndex:D10}.chunk"), chunk.LengthBytes, document.UpdatedAt);
            }

            var artifacts = await context.PreparedJsonDocumentIndexArtifacts
                .AsNoTracking()
                .Where(e => e.DocumentId == documentId)
                .Select(e => new { e.IndexName, Length = e.Payload.Length, e.CreatedAt })
                .ToListAsync(cancellationToken);
            foreach (var artifact in artifacts)
            {
                yield return new PreparedDocumentObjectInfo(new PreparedDocumentObjectName(artifact.IndexName), artifact.Length, artifact.CreatedAt);
            }

            yield return new PreparedDocumentObjectInfo(new PreparedDocumentObjectName(PreparedDocumentFileNames.TransactionsFileName), 0, document.UpdatedAt);
        }

        private static bool TryParseSourceChunkName(string name, out int chunkIndex)
        {
            const string prefix = "source/chunks/";
            const string suffix = ".chunk";
            if (name.StartsWith(prefix, StringComparison.Ordinal) && name.EndsWith(suffix, StringComparison.Ordinal))
            {
                var rawIndex = name[prefix.Length..^suffix.Length];
                return int.TryParse(rawIndex, out chunkIndex);
            }

            chunkIndex = 0;
            return false;
        }

        private async Task<byte[]> BuildTransactionsPayloadAsync(TDbContext context, CancellationToken cancellationToken)
        {
            var transactions = await context.PreparedJsonDocumentTransactions
                .AsNoTracking()
                .Where(e => e.DocumentId == documentId)
                .OrderBy(e => e.TransactionIndex)
                .Select(e => new TransactionRecord(e.TransactionIndex, e.Revision, e.OperationType, e.Payload, e.CreatedAt))
                .ToListAsync(cancellationToken);
            return JsonSerializer.SerializeToUtf8Bytes(new { formatVersion = 1, transactions });
        }

        private sealed record TransactionRecord(int TransactionIndex, int Revision, string OperationType, byte[]? Payload, DateTimeOffset CreatedAt);
    }

    private sealed class EfCorePreparedDocumentReadLease(string documentId, Action<string> releaseReadLease) : PreparedDocumentReadLease
    {
        private int disposed;

        public override ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref disposed, 1) == 0)
            {
                releaseReadLease(documentId);
            }

            return ValueTask.CompletedTask;
        }
    }
}
