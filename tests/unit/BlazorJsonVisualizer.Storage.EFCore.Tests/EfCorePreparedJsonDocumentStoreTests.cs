using System.Text;
using BlazorJsonVisualizer.PreparedDocuments;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Xunit;

namespace BlazorJsonVisualizer.Storage.EFCore.Tests;

public sealed class EfCorePreparedJsonDocumentStoreTests
{
    [Fact]
    public async Task ImportOpenListSearchExportAndDelete_WorkAcrossChunkedStorage()
    {
        await using var fixture = await StorageFixture.CreateAsync();
        var store = fixture.CreateStore();
        var json = "{\"emoji\":\"🐇\",\"name\":\"alice\",\"note\":\"Alice likes json\"}";

        await using var source = new MemoryStream(Encoding.UTF8.GetBytes(json));
        var documentId = await store.ImportAsync(source, "doc-1", chunkSizeBytes: 7);

        var info = await store.GetAsync(documentId);
        Assert.NotNull(info);
        Assert.Equal(JsonDocumentPreparationState.Ready, info!.State);

        var listed = await store.ListAsync();
        Assert.Collection(listed, item => Assert.Equal(documentId, item.DocumentId));

        await using var handle = await store.OpenAsync(documentId);
        Assert.Equal(documentId, handle.DocumentId);
        Assert.Equal(PreparedDocumentIndexState.Ready, handle.Manifest.Indexes.Line.State);
        Assert.Equal(PreparedDocumentIndexState.Missing, handle.Manifest.Indexes.Search.State);

        await using var range = await handle.OpenSourceRangeAsync(0, info.SourceLength);
        using var reader = new StreamReader(range, Encoding.UTF8);
        Assert.Equal(json, await reader.ReadToEndAsync());

        var results = new List<PreparedDocumentSearchResult>();
        await foreach (var result in handle.SearchAsync(new PreparedDocumentSearchQuery("alice", IgnoreCase: true, MaxResults: 2)))
        {
            results.Add(result);
        }

        Assert.Equal(2, results.Count);
        Assert.All(results, result => Assert.Equal(documentId, result.DocumentId));
        Assert.All(results, result => Assert.Equal(1, result.Revision));

        await using var exportDestination = new MemoryStream();
        await handle.ExportAsync(exportDestination, new JsonDocumentExportOptions());
        Assert.Equal(json, Encoding.UTF8.GetString(exportDestination.ToArray()));

        var chunkCount = await fixture.CountChunksAsync(documentId);
        var artifactCount = await fixture.CountArtifactsAsync(documentId);
        Assert.True(chunkCount > 1);
        Assert.True(artifactCount >= 4);

        await handle.DisposeAsync();
        await store.DeleteAsync(documentId);
        Assert.Null(await store.GetAsync(documentId));
        Assert.Empty(await store.ListAsync());
    }

    [Fact]
    public async Task DeleteAsync_FailsWhileHandleIsOpen()
    {
        await using var fixture = await StorageFixture.CreateAsync();
        var store = fixture.CreateStore();
        await using var source = new MemoryStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));
        var documentId = await store.ImportAsync(source, "doc-open", 8);

        await using var handle = await store.OpenAsync(documentId);
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () => await store.DeleteAsync(documentId));
        Assert.Contains("active handles", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task OpenAsync_RejectsUnsupportedFormatVersion()
    {
        await using var fixture = await StorageFixture.CreateAsync();
        await fixture.SeedDocumentAsync("legacy", formatVersion: 2, state: nameof(JsonDocumentPreparationState.Ready), sourceChunkSizeBytes: 16);
        var store = fixture.CreateStore();

        var exception = await Assert.ThrowsAsync<InvalidDataException>(async () => await store.OpenAsync("legacy"));
        Assert.Contains(EfCoreStorageDiagnostics.UnsupportedStorageFormatVersion, exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ImportAsync_RejectsDuplicateDocumentIds()
    {
        await using var fixture = await StorageFixture.CreateAsync();
        var store = fixture.CreateStore();

        await using var source = new MemoryStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));
        _ = await store.ImportAsync(source, "duplicate", 8);

        await using var duplicateSource = new MemoryStream(Encoding.UTF8.GetBytes("{\"ok\":false}"));
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () => await store.ImportAsync(duplicateSource, "duplicate", 8));
        Assert.Contains(EfCoreStorageDiagnostics.DuplicateDocumentId, exception.Message, StringComparison.Ordinal);
    }

    private sealed class StorageFixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection;
        private readonly IDbContextFactory<TestStorageDbContext> factory;

        private StorageFixture(SqliteConnection connection, IDbContextFactory<TestStorageDbContext> factory)
        {
            this.connection = connection;
            this.factory = factory;
        }

        public static async Task<StorageFixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<TestStorageDbContext>()
                .UseSqlite(connection)
                .Options;
            var factory = new PooledDbContextFactory<TestStorageDbContext>(options);

            await using var context = await factory.CreateDbContextAsync();
            await context.Database.EnsureCreatedAsync();
            return new StorageFixture(connection, factory);
        }

        public EfCorePreparedJsonDocumentStore<TestStorageDbContext> CreateStore() => new(factory);

        public async Task<int> CountChunksAsync(string documentId)
        {
            await using var context = await factory.CreateDbContextAsync();
            return await context.PreparedJsonDocumentSourceChunks.CountAsync(e => e.DocumentId == documentId);
        }

        public async Task<int> CountArtifactsAsync(string documentId)
        {
            await using var context = await factory.CreateDbContextAsync();
            return await context.PreparedJsonDocumentIndexArtifacts.CountAsync(e => e.DocumentId == documentId);
        }

        public async Task SeedDocumentAsync(string documentId, int formatVersion, string state, int sourceChunkSizeBytes)
        {
            await using var context = await factory.CreateDbContextAsync();
            context.PreparedJsonDocuments.Add(new Entities.PreparedJsonDocumentEntity
            {
                DocumentId = documentId,
                FormatVersion = formatVersion,
                State = state,
                SourceChunkSizeBytes = sourceChunkSizeBytes,
                SourceLengthBytes = 2,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
                LatestRevision = 1,
                LineIndexState = nameof(PreparedDocumentIndexState.Ready),
                StructureIndexState = nameof(PreparedDocumentIndexState.Ready),
                SearchIndexState = nameof(PreparedDocumentIndexState.Missing),
                PathIndexState = nameof(PreparedDocumentIndexState.Missing),
                TransactionState = nameof(PreparedDocumentIndexState.Ready),
                TransactionLatestRevision = 1
            });
            context.PreparedJsonDocumentSourceChunks.Add(new Entities.PreparedJsonDocumentSourceChunkEntity
            {
                DocumentId = documentId,
                ChunkIndex = 0,
                StartByteOffset = 0,
                LengthBytes = 2,
                Content = Encoding.UTF8.GetBytes("{}")
            });
            await context.SaveChangesAsync();
        }

        public async ValueTask DisposeAsync()
        {
            await connection.DisposeAsync();
        }
    }
}
