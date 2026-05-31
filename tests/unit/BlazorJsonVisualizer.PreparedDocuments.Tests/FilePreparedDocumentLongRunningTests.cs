using System.Diagnostics;
using System.Text;
using BlazorJsonVisualizer.PreparedDocuments;
using BlazorJsonVisualizer.Storage;
using Xunit;

namespace BlazorJsonVisualizer.PreparedDocuments.Tests;

public sealed class FilePreparedDocumentLongRunningTests
{
    [Fact]
    [Trait("TestCategory", "Slow")]
    public async Task ImportSmoke_100MbJsonSource_Completes()
    {
        var profile = LongRunningPreparedDocumentProfile.Current;
        var rootPath = CreateTempDirectory();
        try
        {
            var store = CreateStore(rootPath, profile);
            var importer = new FileJsonDocumentImporter(store);
            await using var source = new GeneratedJsonArrayStream(profile.Import100MbBytes);

            var imported = await importer.ImportAsync(source, new JsonDocumentImportOptions
            {
                DocumentId = "import-100mb-smoke",
                AllowInvalidJson = profile.SkipJsonValidation
            });

            Assert.Equal(JsonDocumentPreparationState.Ready, imported.State);
            Assert.True(imported.SourceLength > 0);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    [Trait("TestCategory", "Slow")]
    public async Task ImportSmoke_500MbJsonSource_Completes()
    {
        var profile = LongRunningPreparedDocumentProfile.Current;
        var rootPath = CreateTempDirectory();
        try
        {
            var store = CreateStore(rootPath, profile);
            var importer = new FileJsonDocumentImporter(store);
            await using var source = new GeneratedJsonArrayStream(profile.Import500MbBytes);

            var imported = await importer.ImportAsync(source, new JsonDocumentImportOptions
            {
                DocumentId = "import-500mb-smoke",
                AllowInvalidJson = profile.SkipJsonValidation
            });

            Assert.Equal(JsonDocumentPreparationState.Ready, imported.State);
            Assert.True(imported.SourceLength > 0);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    [Trait("TestCategory", "Slow")]
    public async Task StoreScale_100PreparedDocuments_CanListAndOpen()
    {
        var profile = LongRunningPreparedDocumentProfile.Current;
        var rootPath = CreateTempDirectory();
        try
        {
            var store = CreateStore(rootPath, profile);
            var importer = new FileJsonDocumentImporter(store);

            for (var index = 0; index < profile.PreparedDocumentCount; index++)
            {
                await using var source = new GeneratedJsonArrayStream(profile.SmallDocumentBytes);
                await importer.ImportAsync(source, new JsonDocumentImportOptions
                {
                    DocumentId = $"scale-{index:D4}",
                    AllowInvalidJson = profile.SkipJsonValidation
                });
            }

            var listed = await store.ListAsync();
            Assert.Equal(profile.PreparedDocumentCount, listed.Count);

            await using var opened = await store.OpenAsync("scale-0000");
            Assert.Equal(JsonDocumentPreparationState.Ready, opened.Manifest.State);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    [Trait("TestCategory", "Slow")]
    public async Task ConcurrentSessions_10Readers_CanOpenSearchAndExport()
    {
        var profile = LongRunningPreparedDocumentProfile.Current;
        var rootPath = CreateTempDirectory();
        try
        {
            var store = CreateStore(rootPath, profile);
            var importer = new FileJsonDocumentImporter(store);
            await using var source = new GeneratedJsonArrayStream(profile.ConcurrentDocumentBytes);
            var imported = await importer.ImportAsync(source, new JsonDocumentImportOptions
            {
                DocumentId = "concurrent-sessions",
                AllowInvalidJson = profile.SkipJsonValidation
            });

            var tasks = Enumerable.Range(0, profile.ConcurrentSessionCount)
                .Select(_ => OpenSearchAndExportAsync(store, imported.DocumentId))
                .ToArray();

            await Task.WhenAll(tasks);
            Assert.All(tasks, task => Assert.True(task.Result > 0));
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    [Trait("TestCategory", "Slow")]
    public async Task SearchLatencySmoke_LargeDocument_ReturnsResultsWithinTarget()
    {
        var profile = LongRunningPreparedDocumentProfile.Current;
        var rootPath = CreateTempDirectory();
        try
        {
            var store = CreateStore(rootPath, profile);
            var importer = new FileJsonDocumentImporter(store);
            await using var source = new GeneratedJsonArrayStream(profile.SearchDocumentBytes);
            var imported = await importer.ImportAsync(source, new JsonDocumentImportOptions
            {
                DocumentId = "large-search",
                AllowInvalidJson = profile.SkipJsonValidation
            });

            await using var opened = await store.OpenAsync(imported.DocumentId);
            var stopwatch = Stopwatch.StartNew();
            var results = new List<PreparedDocumentSearchResult>();
            await foreach (var result in opened.SearchAsync(new PreparedDocumentSearchQuery("needle", MaxResults: 5)))
            {
                results.Add(result);
            }

            stopwatch.Stop();
            Assert.NotEmpty(results);
            Assert.True(stopwatch.Elapsed <= profile.SearchLatencyTarget, $"Search took {stopwatch.Elapsed}, expected at most {profile.SearchLatencyTarget}.");
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    [Trait("TestCategory", "Slow")]
    public async Task ExportSmoke_LargeDocument_StreamsUnchangedSource()
    {
        var profile = LongRunningPreparedDocumentProfile.Current;
        var rootPath = CreateTempDirectory();
        try
        {
            var store = CreateStore(rootPath, profile);
            var importer = new FileJsonDocumentImporter(store);
            await using var source = new GeneratedJsonArrayStream(profile.ExportDocumentBytes);
            var imported = await importer.ImportAsync(source, new JsonDocumentImportOptions
            {
                DocumentId = "large-export",
                AllowInvalidJson = profile.SkipJsonValidation
            });

            await using var opened = await store.OpenAsync(imported.DocumentId);
            await using var destination = new CountingWriteStream();
            await opened.ExportAsync(destination, new JsonDocumentExportOptions());

            Assert.Equal(imported.SourceLength, destination.BytesWritten);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    private static FilePreparedJsonDocumentStore CreateStore(string rootPath, LongRunningPreparedDocumentProfile profile)
        => new(new FilePreparedDocumentStorageOptions
        {
            RootDirectory = rootPath,
            SourceChunkSizeBytes = profile.SourceChunkSizeBytes
        });

    private static async Task<long> OpenSearchAndExportAsync(FilePreparedJsonDocumentStore store, string documentId)
    {
        await using var handle = await store.OpenAsync(documentId);
        var results = 0;
        await foreach (var _ in handle.SearchAsync(new PreparedDocumentSearchQuery("needle", MaxResults: 1)))
        {
            results++;
        }

        await using var destination = new CountingWriteStream();
        await handle.ExportAsync(destination, new JsonDocumentExportOptions());
        return destination.BytesWritten + results;
    }

    private static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "bjv-long-tests", Guid.NewGuid().ToString("n"));
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
            // Best-effort cleanup for long-running temp test directories.
        }
    }

    private sealed record LongRunningPreparedDocumentProfile(
        long Import100MbBytes,
        long Import500MbBytes,
        int PreparedDocumentCount,
        int ConcurrentSessionCount,
        long SmallDocumentBytes,
        long ConcurrentDocumentBytes,
        long SearchDocumentBytes,
        long ExportDocumentBytes,
        int SourceChunkSizeBytes,
        TimeSpan SearchLatencyTarget,
        bool SkipJsonValidation)
    {
        public static LongRunningPreparedDocumentProfile Current => IsFast
            ? new LongRunningPreparedDocumentProfile(
                Import100MbBytes: 16 * 1024,
                Import500MbBytes: 32 * 1024,
                PreparedDocumentCount: 3,
                ConcurrentSessionCount: 2,
                SmallDocumentBytes: 4 * 1024,
                ConcurrentDocumentBytes: 16 * 1024,
                SearchDocumentBytes: 32 * 1024,
                ExportDocumentBytes: 32 * 1024,
                SourceChunkSizeBytes: 4 * 1024,
                SearchLatencyTarget: TimeSpan.FromSeconds(10),
                SkipJsonValidation: false)
            : new LongRunningPreparedDocumentProfile(
                Import100MbBytes: 100L * 1024 * 1024,
                Import500MbBytes: 500L * 1024 * 1024,
                PreparedDocumentCount: 100,
                ConcurrentSessionCount: 10,
                SmallDocumentBytes: 128 * 1024,
                ConcurrentDocumentBytes: 100L * 1024 * 1024,
                SearchDocumentBytes: 500L * 1024 * 1024,
                ExportDocumentBytes: 500L * 1024 * 1024,
                SourceChunkSizeBytes: 1024 * 1024,
                SearchLatencyTarget: TimeSpan.FromSeconds(10),
                SkipJsonValidation: true);

        private static bool IsFast => string.Equals(
            Environment.GetEnvironmentVariable("BJV_LONG_RUNNING_FAST"),
            "1",
            StringComparison.Ordinal);
    }

    private sealed class GeneratedJsonArrayStream : Stream
    {
        private static readonly byte[] Prefix = "["u8.ToArray();
        private static readonly byte[] Suffix = "]"u8.ToArray();
        private readonly long targetBytes;
        private long emittedBytes;
        private int recordIndex;
        private byte[] currentSegment = Prefix;
        private int segmentOffset;
        private bool suffixStarted;

        public GeneratedJsonArrayStream(long targetBytes)
        {
            this.targetBytes = Math.Max(targetBytes, Prefix.Length + Suffix.Length + 128);
        }

        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }

        public override void Flush()
        {
        }

        public override int Read(byte[] buffer, int offset, int count)
            => Read(buffer.AsSpan(offset, count));

        public override int Read(Span<byte> buffer)
        {
            if (buffer.Length == 0)
            {
                return 0;
            }

            var written = 0;
            while (written < buffer.Length)
            {
                if (segmentOffset >= currentSegment.Length)
                {
                    if (!MoveNextSegment())
                    {
                        break;
                    }
                }

                var available = currentSegment.Length - segmentOffset;
                var writable = Math.Min(available, buffer.Length - written);
                currentSegment.AsSpan(segmentOffset, writable).CopyTo(buffer[written..]);
                segmentOffset += writable;
                emittedBytes += writable;
                written += writable;
            }

            return written;
        }

        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return ValueTask.FromResult(Read(buffer.Span));
        }

        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        private bool MoveNextSegment()
        {
            if (suffixStarted)
            {
                return false;
            }

            if (emittedBytes >= targetBytes - Suffix.Length)
            {
                currentSegment = Suffix;
                segmentOffset = 0;
                suffixStarted = true;
                return true;
            }

            var separator = recordIndex == 0 ? string.Empty : ",";
            currentSegment = Encoding.UTF8.GetBytes($"{separator}{{\"id\":{recordIndex},\"name\":\"needle\",\"value\":\"value-{recordIndex:D8}\"}}");
            segmentOffset = 0;
            recordIndex++;
            return true;
        }
    }

    private sealed class CountingWriteStream : Stream
    {
        public long BytesWritten { get; private set; }

        public override bool CanRead => false;
        public override bool CanSeek => false;
        public override bool CanWrite => true;
        public override long Length => BytesWritten;
        public override long Position { get => BytesWritten; set => throw new NotSupportedException(); }

        public override void Flush()
        {
        }

        public override int Read(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count)
        {
            BytesWritten += count;
        }

        public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            BytesWritten += buffer.Length;
            return ValueTask.CompletedTask;
        }
    }
}
