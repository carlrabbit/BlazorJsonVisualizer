using System.Text;
using BlazorJsonVisualizer.PreparedDocuments;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BlazorJsonVisualizer.Storage.EFCore.Tests;

public sealed class EfCorePreparedDocumentStoreTests : IDisposable
{
    private readonly Microsoft.Data.Sqlite.SqliteConnection connection;
    private readonly DbContextOptions<TestStorageDbContext> options;

    public EfCorePreparedDocumentStoreTests()
    {
        connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        connection.Open();
        options = new DbContextOptionsBuilder<TestStorageDbContext>()
            .UseSqlite(connection)
            .Options;

        using var context = new TestStorageDbContext(options);
        context.Database.EnsureCreated();
    }

    public void Dispose() => connection.Dispose();

    private EfCorePreparedJsonDocumentStore<TestStorageDbContext> CreateStore() =>
        new(new ContextFactory(options));

    private EfCoreJsonDocumentImporter<TestStorageDbContext> CreateImporter(
        EfCorePreparedJsonDocumentStore<TestStorageDbContext> store) =>
        new(store);

    private sealed class ContextFactory(DbContextOptions<TestStorageDbContext> opts)
        : IDbContextFactory<TestStorageDbContext>
    {
        public TestStorageDbContext CreateDbContext() => new(opts);
    }

    [Fact]
    public async Task ImportAndStoreLifecycle_Works_ForValidJson()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"name\":\"alice\",\"age\":3}"));
        var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());

        Assert.False(string.IsNullOrWhiteSpace(imported.DocumentId));
        Assert.Equal(JsonDocumentPreparationState.Ready, imported.State);

        var listed = await store.ListAsync();
        var listedDocument = Assert.Single(listed);
        Assert.Equal(imported.DocumentId, listedDocument.DocumentId);

        await using var opened = await store.OpenAsync(imported.DocumentId);
        Assert.Equal(PreparedDocumentIndexState.Ready, opened.Manifest.Indexes.Line.State);
        Assert.Equal(PreparedDocumentIndexState.Ready, opened.Manifest.Indexes.Structure.State);
        Assert.Equal(PreparedDocumentIndexState.Ready, opened.Manifest.Indexes.Search.State);
        Assert.Equal(JsonDocumentPreparationState.Ready, opened.Manifest.State);
        Assert.Equal(imported.DocumentId, opened.DocumentId);

        await using var exportStream = new MemoryStream();
        await opened.ExportAsync(exportStream, new JsonDocumentExportOptions());
        var exportedJson = Encoding.UTF8.GetString(exportStream.ToArray());
        Assert.Equal("{\"name\":\"alice\",\"age\":3}", exportedJson);

        await opened.DisposeAsync();
        Assert.Single(await store.ListAsync());
    }

    [Fact]
    public async Task ImportAsync_InvalidJson_ThrowsInvalidDataException()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{ invalid json"));

        var exception = await Assert.ThrowsAsync<InvalidDataException>(async () =>
            await importer.ImportAsync(
                sourceStream,
                new JsonDocumentImportOptions { DocumentId = "bad-json-doc", AllowInvalidJson = false }));

        Assert.Equal("Source stream is not valid JSON.", exception.Message);

        // Document should be in Failed state, not visible via ListAsync.
        Assert.Empty(await store.ListAsync());
    }

    [Fact]
    public async Task ImportAsync_AllowInvalidJson_Succeeds()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("not-valid-json"));
        var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions
        {
            AllowInvalidJson = true
        });

        Assert.Equal(JsonDocumentPreparationState.Ready, imported.State);
    }

    [Fact]
    public async Task ImportAsync_IndexOptions_PersistedInManifest()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));
        var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions
        {
            BuildSearchIndex = false,
            BuildPathIndex = false
        });

        await using var opened = await store.OpenAsync(imported.DocumentId);
        Assert.Equal(PreparedDocumentIndexState.Missing, opened.Manifest.Indexes.Search.State);
        Assert.Equal(PreparedDocumentIndexState.Missing, opened.Manifest.Indexes.Path.State);
    }

    [Fact]
    public async Task OpenAsync_DocumentNotFound_Throws()
    {
        var store = CreateStore();

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await store.OpenAsync("nonexistent-doc"));

        Assert.Contains(EfCoreStorageDiagnostics.DocumentNotFound, exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GetAsync_DocumentNotFound_ReturnsNull()
    {
        var store = CreateStore();

        var result = await store.GetAsync("nonexistent-doc");

        Assert.Null(result);
    }

    [Fact]
    public async Task ListAsync_EmptyStore_ReturnsEmpty()
    {
        var store = CreateStore();

        var result = await store.ListAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task ImportAsync_DuplicateDocumentId_Throws()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await using var source1 = new MemoryStream(Encoding.UTF8.GetBytes("{\"first\":true}"));
        await importer.ImportAsync(source1, new JsonDocumentImportOptions { DocumentId = "dup-id" });

        await using var source2 = new MemoryStream(Encoding.UTF8.GetBytes("{\"second\":true}"));
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await importer.ImportAsync(source2, new JsonDocumentImportOptions { DocumentId = "dup-id" }));

        Assert.Contains(EfCoreStorageDiagnostics.DuplicateDocumentId, exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task DeleteAsync_RemovesAllRelatedData()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));
        var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());

        await store.DeleteAsync(imported.DocumentId);

        using var context = new TestStorageDbContext(options);
        Assert.Equal(0, await context.PreparedJsonDocuments.CountAsync());
        Assert.Equal(0, await context.PreparedJsonDocumentSourceChunks.CountAsync());
        Assert.Equal(0, await context.PreparedJsonDocumentIndexArtifacts.CountAsync());
        Assert.Equal(0, await context.PreparedJsonDocumentImportJobs.CountAsync());
    }

    [Fact]
    public async Task SearchAsync_ReturnsMatchesWithPreviews()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"name\":\"alice\",\"note\":\"Alice likes JSON\"}"));
        var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());

        await using var opened = await store.OpenAsync(imported.DocumentId);
        var results = new List<PreparedDocumentSearchResult>();
        await foreach (var result in opened.SearchAsync(new PreparedDocumentSearchQuery("alice", IgnoreCase: true, MaxResults: 5)))
        {
            results.Add(result);
        }

        Assert.Equal(2, results.Count);
        Assert.All(results, r => Assert.Equal(imported.DocumentId, r.DocumentId));
        Assert.Contains("alice", results[0].Preview, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task OpenAsync_MultiChunk_SourceRoundTrips()
    {
        var json = "{\"items\":[1,2,3,4,5,6,7,8,9,10],\"name\":\"chunked-test\"}";
        var store = CreateStore();
        var importer = CreateImporter(store);

        await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions
        {
            SourceChunkSizeBytes = 8
        });

        await using var opened = await store.OpenAsync(imported.DocumentId);
        await using var readStream = await opened.OpenSourceReadStreamAsync();
        using var reader = new StreamReader(readStream, Encoding.UTF8);
        var roundTripped = await reader.ReadToEndAsync();

        Assert.Equal(json, roundTripped);
    }

    [Fact]
    public async Task ImportAsync_NullSource_Throws()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await Assert.ThrowsAsync<ArgumentNullException>(async () =>
            await importer.ImportAsync(null!, new JsonDocumentImportOptions()));
    }

    [Fact]
    public async Task ImportAsync_NullOptions_Throws()
    {
        var store = CreateStore();
        var importer = CreateImporter(store);

        await Assert.ThrowsAsync<ArgumentNullException>(async () =>
            await importer.ImportAsync(new MemoryStream(), null!));
    }
}
