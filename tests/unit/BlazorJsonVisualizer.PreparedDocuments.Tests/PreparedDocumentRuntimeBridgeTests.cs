using System.Text;
using System.Text.Json;
using BlazorJsonVisualizer.PreparedDocuments;
using BlazorJsonVisualizer.Protocol;
using Xunit;

namespace BlazorJsonVisualizer.PreparedDocuments.Tests;

public sealed class PreparedDocumentRuntimeBridgeTests
{
    private const string SampleJson = """
{
  "document": {
    "nested": {
      "enabled": true,
      "items": [1, 2, 3]
    }
  },
  "features": ["viewing", "search"]
}
""";

    [Fact]
    public async Task OpenAsync_ReturnsMetadataAndCapabilities()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync();
        try
        {
            var result = await bridge.OpenAsync(new PreparedOpenRequestDto("session-open", documentId));

            Assert.True(result.Success);
            Assert.NotNull(result.Metadata);
            Assert.Equal(documentId, result.Metadata!.DocumentId);
            Assert.Equal(1, result.Metadata.Revision);
            Assert.Equal("ready", result.Metadata.DocumentState);
            Assert.Contains("search", result.Metadata.Capabilities);
            Assert.Contains("revealByJsonPointer", result.Metadata.Capabilities);
            Assert.Equal("ready", result.Metadata.Indexes["search"].State);
            Assert.Equal("ready", result.Metadata.Indexes["path"].State);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task OpenAsync_UnknownDocument_ReturnsExplicitDiagnostic()
    {
        var rootPath = CreateTempDirectory();
        try
        {
            var bridge = new PreparedDocumentRuntimeBridge(new FilePreparedJsonDocumentStore(rootPath));

            var result = await bridge.OpenAsync(new PreparedOpenRequestDto("missing-session", "missing-document"));

            Assert.False(result.Success);
            Assert.Equal("prepared.documentNotFound", Assert.Single(result.Diagnostics!).Code);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task MetadataDto_SerializesRevisionIdentity()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync();
        try
        {
            await bridge.OpenAsync(new PreparedOpenRequestDto("session-metadata", documentId));
            var metadata = await bridge.GetMetadataAsync("session-metadata");

            var json = JsonSerializer.Serialize(metadata);
            var roundTrip = JsonSerializer.Deserialize<PreparedDocumentMetadataDto>(json);

            Assert.NotNull(roundTrip);
            Assert.Equal(documentId, roundTrip!.DocumentId);
            Assert.Equal(1, roundTrip.Revision);
            Assert.Equal("ready", roundTrip.Indexes["structure"].State);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task ReadTextRangeAsync_ReturnsBoundedChunk()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync();
        try
        {
            await bridge.OpenAsync(new PreparedOpenRequestDto("session-range", documentId));

            var range = await bridge.ReadTextRangeAsync(new PreparedTextRangeRequestDto("session-range", 0, 16));

            Assert.Equal(documentId, range.DocumentId);
            Assert.Equal(0, range.ActualStartByteOffset);
            Assert.True(range.ActualEndByteOffset <= 16);
            Assert.False(string.IsNullOrWhiteSpace(range.Text));
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task GetRowsAsync_AndSetFoldState_HideDescendants()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync();
        try
        {
            await bridge.OpenAsync(new PreparedOpenRequestDto("session-rows", documentId));
            var initialRows = await bridge.GetRowsAsync(new PreparedRowsRequestDto("session-rows", 0, 50));
            var nestedRow = Assert.Single(initialRows.Rows, static row => row.Text.Contains("\"nested\": {", StringComparison.Ordinal));
            Assert.NotNull(nestedRow.NodeId);
            Assert.Contains(initialRows.Rows, static row => row.Text.Contains("\"enabled\": true", StringComparison.Ordinal));

            var foldResult = await bridge.SetFoldStateAsync(new PreparedFoldStateRequestDto("session-rows", nestedRow.NodeId!, true));
            var foldedRows = await bridge.GetRowsAsync(new PreparedRowsRequestDto("session-rows", 0, 50, foldResult.FoldStateRevision));

            Assert.True(foldResult.Success);
            Assert.DoesNotContain(foldedRows.Rows, static row => row.Text.Contains("\"enabled\": true", StringComparison.Ordinal));
            Assert.Contains(foldedRows.Rows, static row => row.Text.Contains("\"nested\": { … }", StringComparison.Ordinal));
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task SearchAsync_ReturnsOffsetsAndPathData()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync();
        try
        {
            await bridge.OpenAsync(new PreparedOpenRequestDto("session-search", documentId));

            var page = await bridge.SearchAsync(new PreparedSearchRequestDto("session-search", "viewing", MaxResults: 5));

            var result = Assert.Single(page.Results);
            Assert.Equal(documentId, page.DocumentId);
            Assert.Contains("viewing", result.Preview, StringComparison.OrdinalIgnoreCase);
            Assert.NotNull(result.Path);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task RevealAsync_BySearchResultOffset_Succeeds()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync();
        try
        {
            await bridge.OpenAsync(new PreparedOpenRequestDto("session-reveal-search", documentId));
            var page = await bridge.SearchAsync(new PreparedSearchRequestDto("session-reveal-search", "search", MaxResults: 5));
            var result = Assert.Single(page.Results);

            var reveal = await bridge.RevealAsync(new PreparedRevealRequestDto(
                "session-reveal-search",
                new PreparedRevealTargetDto("searchResult", StartByteOffset: result.StartByteOffset, EndByteOffset: result.EndByteOffset, ResultId: result.ResultId)));

            Assert.True(reveal.Success);
            Assert.NotNull(reveal.RowIndex);
            Assert.NotNull(reveal.Viewport);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task RevealAsync_ByJsonPointer_Succeeds_AndMissingPathFails()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync();
        try
        {
            await bridge.OpenAsync(new PreparedOpenRequestDto("session-path", documentId));

            var success = await bridge.RevealAsync(new PreparedRevealRequestDto("session-path", new PreparedRevealTargetDto("jsonPointer", Path: "/document/nested/items")));
            var failure = await bridge.RevealAsync(new PreparedRevealRequestDto("session-path", new PreparedRevealTargetDto("jsonPointer", Path: "/document/missing")));

            Assert.True(success.Success);
            Assert.Equal("notFound", failure.Reason);
            Assert.Equal("prepared.pathNotFound", Assert.Single(failure.Diagnostics!).Code);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task MissingIndexes_ReturnExplicitDiagnostics()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync(buildSearchIndex: false, buildPathIndex: false);
        try
        {
            await bridge.OpenAsync(new PreparedOpenRequestDto("session-missing-indexes", documentId));

            var search = await bridge.SearchAsync(new PreparedSearchRequestDto("session-missing-indexes", "viewing", MaxResults: 5));
            var reveal = await bridge.RevealAsync(new PreparedRevealRequestDto("session-missing-indexes", new PreparedRevealTargetDto("jsonPointer", Path: "/features")));

            Assert.Equal("prepared.indexMissing", Assert.Single(search.Diagnostics!).Code);
            Assert.Equal("indexMissing", reveal.Reason);
            Assert.Equal("prepared.indexMissing", Assert.Single(reveal.Diagnostics!).Code);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    [Fact]
    public async Task CloseAsync_DisposesSession_AndFurtherRequestsFailExplicitly()
    {
        var (bridge, documentId, rootPath) = await CreateBridgeAsync();
        try
        {
            await bridge.OpenAsync(new PreparedOpenRequestDto("session-close", documentId));

            var close = await bridge.CloseAsync("session-close");
            var rows = await bridge.GetRowsAsync(new PreparedRowsRequestDto("session-close", 0, 10));

            Assert.True(close.Success);
            Assert.Equal("prepared.sessionNotFound", Assert.Single(rows.Diagnostics!).Code);
        }
        finally
        {
            TryDeleteDirectory(rootPath);
        }
    }

    private static async Task<(PreparedDocumentRuntimeBridge Bridge, string DocumentId, string RootPath)> CreateBridgeAsync(
        bool buildSearchIndex = true,
        bool buildPathIndex = true)
    {
        var rootPath = CreateTempDirectory();
        var store = new FilePreparedJsonDocumentStore(rootPath);
        var importer = new FileJsonDocumentImporter(store);
        await using var sourceStream = new MemoryStream(Encoding.UTF8.GetBytes(SampleJson));
        var imported = await importer.ImportAsync(sourceStream, new JsonDocumentImportOptions
        {
            BuildSearchIndex = buildSearchIndex,
            BuildPathIndex = buildPathIndex
        });

        return (new PreparedDocumentRuntimeBridge(store), imported.DocumentId, rootPath);
    }

    private static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "bjv-runtime-bridge-tests", Guid.NewGuid().ToString("n"));
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
}
