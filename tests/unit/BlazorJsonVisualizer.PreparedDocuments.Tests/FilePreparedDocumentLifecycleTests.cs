using System.Text;
using System.Text.Json;
using BlazorJsonVisualizer.PreparedDocuments;
using BlazorJsonVisualizer.Protocol;
using BlazorJsonVisualizer.Storage;
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
            Assert.True(File.Exists(Path.Combine(rootPath, imported.DocumentId, "manifest.json")));
            Assert.True(File.Exists(Path.Combine(rootPath, imported.DocumentId, "source", "chunks", "0000000000.chunk")));
            Assert.True(File.Exists(Path.Combine(rootPath, imported.DocumentId, "indexes", "lines.index")));
            Assert.True(File.Exists(Path.Combine(rootPath, imported.DocumentId, "indexes", "structure.index")));
            Assert.True(File.Exists(Path.Combine(rootPath, imported.DocumentId, "indexes", "search.index")));

            var listed = await store.ListAsync();
            var listedDocument = Assert.Single(listed);
            Assert.Equal(imported.DocumentId, listedDocument.DocumentId);

            await using var opened = await store.OpenAsync(imported.DocumentId);
            Assert.Equal(PreparedDocumentIndexState.Ready, opened.Manifest.Indexes.Line.State);
            Assert.Equal(PreparedDocumentIndexState.Ready, opened.Manifest.Indexes.Structure.State);
            Assert.Equal(PreparedDocumentIndexState.Ready, opened.Manifest.Indexes.Search.State);
            Assert.Equal(0, opened.Manifest.Transactions.Count);
            Assert.Equal(1, opened.Manifest.Transactions.LatestRevision);

            await using var destination = new MemoryStream();
            await exporter.ExportAsync(imported.DocumentId, destination, new JsonDocumentExportOptions());

            var exportedJson = Encoding.UTF8.GetString(destination.ToArray());
            Assert.Equal("{\"name\":\"alice\",\"age\":3}", exportedJson);

            await opened.DisposeAsync();
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

            var transactionPath = Path.Combine(rootPath, imported.DocumentId, "transactions", "log.jsonl");
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
    public async Task ExportWithResultAsync_AppliesSupportedControlledEditTransactionAndReportsRevision()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var importer = new FileJsonDocumentImporter(store);
            var exporter = new FileJsonDocumentExporter(store);

            await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("""
                {
                  "name": "alice",
                  "age": 3
                }
                """));
            var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());
            var bridge = new PreparedDocumentRuntimeBridge(store);
            await bridge.OpenAsync(new PreparedOpenRequestDto("export-edit", imported.DocumentId));
            var rows = await bridge.GetRowsAsync(new PreparedRowsRequestDto("export-edit", 0, 20));
            var ageRow = Assert.Single(rows.Rows, static row => row.Text.Contains("\"age\": 3", StringComparison.Ordinal));

            using var value = JsonDocument.Parse("4");
            var edit = await bridge.ApplyEditAsync(new PreparedEditCommandDto(
                "export-edit",
                imported.DocumentId,
                1,
                PreparedEditCommandKinds.ReplaceNodeValue,
                TargetPath: ageRow.Path,
                Value: value.RootElement));

            await using var destination = new MemoryStream();
            var export = await exporter.ExportWithResultAsync(imported.DocumentId, destination, new JsonDocumentExportOptions());

            Assert.True(edit.Success, string.Join("; ", edit.Diagnostics?.Select(static diagnostic => $"{diagnostic.Code}: {diagnostic.Message}") ?? []));
            Assert.Equal(2, export.ExportedRevision);
            Assert.Equal(1, export.TransactionCount);
            Assert.Equal(edit.Transaction!.TransactionId, export.LatestTransactionId);
            Assert.Equal("{\"name\":\"alice\",\"age\":4}", Encoding.UTF8.GetString(destination.ToArray()));
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

    [Fact]
    public async Task ImportAsync_ChunksAndRanges_HandleUtf8Boundaries()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(new FilePreparedDocumentStorageOptions
            {
                RootDirectory = rootPath,
                SourceChunkSizeBytes = 7
            });
            var importer = new FileJsonDocumentImporter(store);
            var json = "{\"emoji\":\"🐇\",\"name\":\"alice\"}";
            await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes(json));

            var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());

            await using var opened = await store.OpenAsync(imported.DocumentId);
            await using var range = await opened.OpenSourceRangeAsync(0, imported.SourceLength);
            using var reader = new StreamReader(range, Encoding.UTF8);
            Assert.Equal(json, await reader.ReadToEndAsync());

            var chunkFiles = Directory.GetFiles(Path.Combine(rootPath, imported.DocumentId, "source", "chunks"));
            Assert.True(chunkFiles.Length > 1);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task SearchAsync_ReturnsOffsetsPreviewsAndRevision()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var importer = new FileJsonDocumentImporter(store);
            await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"name\":\"alice\",\"note\":\"Alice likes JSON\"}"));
            var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());

            await using var opened = await store.OpenAsync(imported.DocumentId);
            var results = new List<PreparedDocumentSearchResult>();
            await foreach (var result in opened.SearchAsync(new PreparedDocumentSearchQuery("alice", IgnoreCase: true, MaxResults: 2)))
            {
                results.Add(result);
            }

            Assert.Equal(2, results.Count);
            Assert.All(results, result => Assert.Equal(imported.DocumentId, result.DocumentId));
            Assert.All(results, result => Assert.Equal(1, result.Revision));
            Assert.Contains("alice", results[0].Preview, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task DeleteAsync_FailsWhileHandleIsOpen()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var importer = new FileJsonDocumentImporter(store);
            await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));
            var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions());

            await using var opened = await store.OpenAsync(imported.DocumentId);

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () => await store.DeleteAsync(imported.DocumentId));
            Assert.Contains("active handles", exception.Message, StringComparison.Ordinal);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task StorageProvider_RejectsPathTraversalAndEnforcesSingleWriter()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var provider = new FilePreparedDocumentStorageProvider(new FilePreparedDocumentStorageOptions { RootDirectory = rootPath });

            await Assert.ThrowsAsync<ArgumentException>(async () => await provider.CreateContainerAsync("../bad"));

            var container = await provider.CreateContainerAsync("safe");
            await using var writer = await container.AcquireWriteLeaseAsync();
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () => await container.AcquireWriteLeaseAsync());
            Assert.Contains("active readers or a writer", exception.Message, StringComparison.Ordinal);
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
