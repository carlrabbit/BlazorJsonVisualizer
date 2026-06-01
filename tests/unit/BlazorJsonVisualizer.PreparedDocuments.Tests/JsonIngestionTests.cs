using System.Text;
using BlazorJsonVisualizer.Ingestion;
using BlazorJsonVisualizer.PreparedDocuments;
using BlazorJsonVisualizer.Storage;
using Xunit;

namespace BlazorJsonVisualizer.PreparedDocuments.Tests;

public sealed class JsonIngestionTests
{
    [Fact]
    public async Task StreamSourceImportJob_CompletesWithOpenablePreparedDocument()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var manager = new InProcessJsonImportJobManager(new FileJsonDocumentImporter(store), store);
            await using var stream = new MemoryStream(Encoding.UTF8.GetBytes("{\"name\":\"alice\"}"));
            var source = new JsonStreamIngestionSource(stream, displayName: "sample.json");

            var handle = await manager.StartAsync(source, new JsonImportRequest());
            var result = await manager.WaitForCompletionAsync(handle.JobId);
            var status = await manager.GetStatusAsync(handle.JobId);

            Assert.Equal(JsonImportResultState.Succeeded, result.State);
            Assert.NotNull(result.Document);
            Assert.Equal(JsonImportJobState.Ready, status?.State);
            Assert.Equal(stream.Length, status?.Progress.TotalBytes);
            Assert.Equal(1, status?.Progress.Fraction);
            await using var opened = await store.OpenAsync(result.Document!.DocumentId);
            Assert.Equal(JsonDocumentPreparationState.Ready, opened.Manifest.State);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task FileSource_ReportsFileNameAndImports()
    {
        var rootPath = CreateTempDirectory();
        var sourcePath = Path.Combine(rootPath, "source.json");
        try
        {
            await File.WriteAllTextAsync(sourcePath, "{\"ok\":true}", Encoding.UTF8);
            var store = new FilePreparedJsonDocumentStore(Path.Combine(rootPath, "prepared"));
            var manager = new InProcessJsonImportJobManager(new FileJsonDocumentImporter(store), store);
            var source = new JsonFileIngestionSource(sourcePath);

            var handle = await manager.StartAsync(source, new JsonImportRequest());
            var result = await manager.WaitForCompletionAsync(handle.JobId);

            Assert.Equal("source.json", source.DisplayName);
            Assert.Equal(new FileInfo(sourcePath).Length, source.Length);
            Assert.True(result.State is JsonImportResultState.Succeeded or JsonImportResultState.SucceededWithWarnings);
            Assert.NotNull(await store.GetAsync(result.Document!.DocumentId));
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task UnknownLength_AddsProgressDiagnosticWithoutPercentage()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var manager = new InProcessJsonImportJobManager(new FileJsonDocumentImporter(store), store);
            await using var stream = new UnknownLengthStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));
            var source = new JsonStreamIngestionSource(stream);

            var handle = await manager.StartAsync(source, new JsonImportRequest());
            var result = await manager.WaitForCompletionAsync(handle.JobId);
            var status = await manager.GetStatusAsync(handle.JobId);

            Assert.Equal(JsonImportResultState.SucceededWithWarnings, result.State);
            Assert.Contains(result.Diagnostics!, diagnostic => diagnostic.Code == JsonImportDiagnosticCodes.UnknownLength);
            Assert.Null(status?.Progress.TotalBytes);
            Assert.Null(status?.Progress.Fraction);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task Utf8Bom_IsAcceptedSkippedAndDiagnosed()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var manager = new InProcessJsonImportJobManager(new FileJsonDocumentImporter(store), store);
            var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes("{\"ok\":true}")).ToArray();
            await using var stream = new MemoryStream(bytes);
            var source = new JsonStreamIngestionSource(stream);

            var handle = await manager.StartAsync(source, new JsonImportRequest());
            var result = await manager.WaitForCompletionAsync(handle.JobId);

            Assert.Equal(JsonImportResultState.SucceededWithWarnings, result.State);
            Assert.Contains(result.Diagnostics!, diagnostic => diagnostic.Code == JsonImportDiagnosticCodes.Utf8BomAccepted);
            await using var opened = await store.OpenAsync(result.Document!.DocumentId);
            await using var sourceRange = await opened.OpenSourceRangeAsync(0, result.Document.SourceLength);
            using var reader = new StreamReader(sourceRange, Encoding.UTF8);
            Assert.Equal("{\"ok\":true}", await reader.ReadToEndAsync());
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task UnsupportedEncoding_FailsWithDiagnosticAndNoReadyDocument()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var manager = new InProcessJsonImportJobManager(new FileJsonDocumentImporter(store), store);
            var bytes = Encoding.Unicode.GetPreamble().Concat(Encoding.Unicode.GetBytes("{\"ok\":true}")).ToArray();
            await using var stream = new MemoryStream(bytes);
            var source = new JsonStreamIngestionSource(stream, contentType: "application/json; charset=utf-16");

            var handle = await manager.StartAsync(source, new JsonImportRequest { DocumentId = "utf16" });
            var result = await manager.WaitForCompletionAsync(handle.JobId);

            Assert.Equal(JsonImportResultState.Failed, result.State);
            Assert.Null(result.Document);
            Assert.Contains(result.Diagnostics!, diagnostic => diagnostic.Code == JsonImportDiagnosticCodes.UnsupportedEncoding);
            Assert.Null(await store.GetAsync("utf16"));
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task InvalidJson_FailsWithDiagnosticLocationAndNoReadyDocument()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var manager = new InProcessJsonImportJobManager(new FileJsonDocumentImporter(store), store);
            await using var stream = new MemoryStream(Encoding.UTF8.GetBytes("{\n  \"ok\": }"));
            var source = new JsonStreamIngestionSource(stream);

            var handle = await manager.StartAsync(source, new JsonImportRequest { DocumentId = "bad" });
            var result = await manager.WaitForCompletionAsync(handle.JobId);

            var diagnostic = Assert.Single(result.Diagnostics!, diagnostic => diagnostic.Code == JsonImportDiagnosticCodes.InvalidJson);
            Assert.Equal(JsonImportResultState.Failed, result.State);
            Assert.True(diagnostic.Line > 0);
            Assert.True(diagnostic.Column > 0);
            Assert.Null(result.Document);
            Assert.Null(await store.GetAsync("bad"));
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task DuplicateDocumentId_FailsWithDiagnosticAndDoesNotReplaceReadyDocument()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(rootPath);
            var manager = new InProcessJsonImportJobManager(new FileJsonDocumentImporter(store), store);
            await using var first = new MemoryStream(Encoding.UTF8.GetBytes("{\"first\":true}"));
            var firstHandle = await manager.StartAsync(new JsonStreamIngestionSource(first), new JsonImportRequest { DocumentId = "same" });
            var firstResult = await manager.WaitForCompletionAsync(firstHandle.JobId);
            Assert.Equal(JsonImportResultState.Succeeded, firstResult.State);

            await using var second = new MemoryStream(Encoding.UTF8.GetBytes("{\"second\":true}"));
            var secondHandle = await manager.StartAsync(new JsonStreamIngestionSource(second), new JsonImportRequest { DocumentId = "same" });
            var secondResult = await manager.WaitForCompletionAsync(secondHandle.JobId);

            Assert.Equal(JsonImportResultState.Failed, secondResult.State);
            Assert.Contains(secondResult.Diagnostics!, diagnostic => diagnostic.Code == JsonImportDiagnosticCodes.InvalidDocumentId);
            await using var opened = await store.OpenAsync("same");
            await using var sourceRange = await opened.OpenSourceRangeAsync(0, firstResult.Document!.SourceLength);
            using var reader = new StreamReader(sourceRange, Encoding.UTF8);
            Assert.Equal("{\"first\":true}", await reader.ReadToEndAsync());
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task CancelledJob_FinishesCancelledWithoutReadyDocument()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var store = new FilePreparedJsonDocumentStore(new FilePreparedDocumentStorageOptions
            {
                RootDirectory = rootPath,
                SourceChunkSizeBytes = 1
            });
            var manager = new InProcessJsonImportJobManager(new FileJsonDocumentImporter(store), store);
            await using var stream = new BlockingReadStream(Encoding.UTF8.GetBytes("{\"ok\":true}"));
            var handle = await manager.StartAsync(new JsonStreamIngestionSource(stream), new JsonImportRequest { DocumentId = "cancelled" });

            await stream.WaitUntilReadStartedAsync();
            await manager.CancelAsync(handle.JobId);
            stream.ReleaseReads();
            var result = await manager.WaitForCompletionAsync(handle.JobId);

            Assert.Equal(JsonImportResultState.Cancelled, result.State);
            Assert.Null(result.Document);
            Assert.Contains(result.Diagnostics!, diagnostic => diagnostic.Code == JsonImportDiagnosticCodes.Cancelled);
            Assert.Null(await store.GetAsync("cancelled"));
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    private static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "bjv-ingestion-tests", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(path);
        return path;
    }

    private static void TryDeleteDirectory(string path)
    {
        if (Directory.Exists(path))
        {
            Directory.Delete(path, recursive: true);
        }
    }

    private sealed class UnknownLengthStream(byte[] bytes) : MemoryStream(bytes)
    {
        public override bool CanSeek => false;

        public override long Length => throw new NotSupportedException();

        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }
    }

    private sealed class BlockingReadStream(byte[] bytes) : MemoryStream(bytes)
    {
        private readonly TaskCompletionSource readStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly TaskCompletionSource releaseReads = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public Task WaitUntilReadStartedAsync() => readStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

        public void ReleaseReads() => releaseReads.TrySetResult();

        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            readStarted.TrySetResult();
            await releaseReads.Task.WaitAsync(cancellationToken);
            return await base.ReadAsync(buffer, cancellationToken);
        }
    }
}
