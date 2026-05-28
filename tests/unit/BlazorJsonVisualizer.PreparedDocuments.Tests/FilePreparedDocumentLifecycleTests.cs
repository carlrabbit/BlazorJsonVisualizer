using System.Text;
using BlazorJsonVisualizer.PreparedDocuments;
using Xunit;

namespace BlazorJsonVisualizer.PreparedDocuments.Tests;

public sealed class FilePreparedDocumentLifecycleTests
{
    [Fact]
    public async Task ImportAndStoreLifecycle_Works_ForValidJson()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var importer = new FileJsonDocumentImporter(store);
            var exporter = new FileJsonDocumentExporter(store);

            await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"name\":\"alice\",\"age\":3}"));

            var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());

            Assert.False(string.IsNullOrWhiteSpace(imported.DocumentId));
            Assert.Equal(JsonDocumentPreparationState.Ready, imported.State);

            var manifestPath = Path.Combine(rootPath, imported.DocumentId, "manifest.json");
            Assert.True(File.Exists(manifestPath));

            var listed = await store.ListAsync();
            var listedDocument = Assert.Single(listed);
            Assert.Equal(imported.DocumentId, listedDocument.DocumentId);

            await using var opened = await store.OpenAsync(imported.DocumentId);
            Assert.Equal(PreparedDocumentIndexState.Ready, opened.Manifest.Indexes.Structure.State);
            Assert.Equal(PreparedDocumentIndexState.Ready, opened.Manifest.Indexes.Search.State);
            Assert.Equal(0, opened.Manifest.Transactions.Count);
            Assert.Equal(1, opened.Manifest.Transactions.LatestRevision);

            await using var destination = new MemoryStream();
            await exporter.ExportAsync(imported.DocumentId, destination, new JsonDocumentExportOptions());

            var exportedJson = Encoding.UTF8.GetString(destination.ToArray());
            Assert.Equal("{\"name\":\"alice\",\"age\":3}", exportedJson);

            await store.DeleteAsync(imported.DocumentId);
            Assert.Empty(await store.ListAsync());
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task ImportAsync_InvalidJson_ThrowsAndCleansArtifacts()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var importer = new FileJsonDocumentImporter(store);

            await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{ invalid json"));

            var exception = await Assert.ThrowsAsync<InvalidDataException>(async () =>
                await importer.ImportAsync(
                    sourceStream,
                    new JsonDocumentImportOptions { DocumentId = "bad", AllowInvalidJson = false }));

            Assert.Equal("Source stream is not valid JSON.", exception.Message);
            Assert.False(Directory.Exists(Path.Combine(rootPath, "bad")));
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task ImportAsync_IndexOptions_ArePersistedInManifest()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var importer = new FileJsonDocumentImporter(store);

            await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));

            var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions
            {
                BuildSearchIndex = false,
                BuildPathIndex = false
            });

            await using var opened = await store.OpenAsync(imported.DocumentId);

            Assert.Equal(PreparedDocumentIndexState.Missing, opened.Manifest.Indexes.Search.State);
            Assert.Equal(PreparedDocumentIndexState.Missing, opened.Manifest.Indexes.Path.State);

            var transactionPath = Path.Combine(rootPath, imported.DocumentId, "transactions.log");
            Assert.True(File.Exists(transactionPath));
            var transactionLog = await File.ReadAllTextAsync(transactionPath);
            Assert.Contains("\"transactions\":[]", transactionLog);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task ExportAsync_WithNonWritableDestination_Throws()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var importer = new FileJsonDocumentImporter(store);
            var exporter = new FileJsonDocumentExporter(store);

            await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));
            var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());

            await using var destination = new NonWritableMemoryStream();
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await exporter.ExportAsync(imported.DocumentId, destination, new JsonDocumentExportOptions()));

            Assert.Equal("Destination stream must be writable.", exception.Message);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    private static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "bjv-tests", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(path);
        return path;
    }

    private static void TryDeleteDirectory(string path)
    {
        if (!Directory.Exists(path))
        {
            return;
        }

        try
        {
            Directory.Delete(path, recursive: true);
        }
        catch
        {
            // Best-effort cleanup for temp test directories.
        }
    }

    private sealed class NonWritableMemoryStream : MemoryStream
    {
        public override bool CanWrite => false;
    }
}
