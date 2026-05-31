using System.Buffers;
using System.Text;
using BlazorJsonVisualizer.Storage;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class PreparedJsonDocumentHandle : IAsyncDisposable
{
    private readonly PreparedDocumentContainer container;
    private readonly PreparedDocumentReadLease lease;
    private bool disposed;

    internal PreparedJsonDocumentHandle(PreparedDocumentContainer container, PreparedDocumentReadLease lease, PreparedDocumentManifest manifest)
    {
        this.container = container;
        this.lease = lease;
        DocumentId = container.DocumentId;
        Manifest = manifest;
    }

    public string DocumentId { get; }

    public long Revision => Manifest.LatestRevision;

    public PreparedDocumentManifest Manifest { get; }

    public ValueTask<Stream> OpenSourceReadStreamAsync(CancellationToken cancellationToken = default)
        => ValueTask.FromResult<Stream>(new ChunkSequenceReadStream(container, GetChunkNames(), cancellationToken));

    public async ValueTask<Stream> OpenSourceRangeAsync(long startOffset, long length, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (startOffset < 0 || length < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(startOffset), "Range offsets must be non-negative.");
        }

        var sourceLength = Manifest.SourceLengthBytes == 0 ? Manifest.SourceLength : Manifest.SourceLengthBytes;
        if (startOffset > sourceLength)
        {
            throw new ArgumentOutOfRangeException(nameof(startOffset), "Range start is beyond the source length.");
        }

        var boundedLength = Math.Min(length, sourceLength - startOffset);
        var chunkSize = Manifest.SourceChunkSizeBytes;
        if (chunkSize <= 0)
        {
            throw new InvalidDataException($"Prepared document '{DocumentId}' has invalid chunk metadata.");
        }

        var stream = new MemoryStream(capacity: (int)Math.Min(boundedLength, int.MaxValue));
        var remaining = boundedLength;
        var currentOffset = startOffset;
        while (remaining > 0)
        {
            var chunkIndex = currentOffset / chunkSize;
            var offsetInChunk = currentOffset % chunkSize;
            var toRead = Math.Min(remaining, chunkSize - offsetInChunk);
            var chunkName = new PreparedDocumentObjectName($"source/chunks/{chunkIndex:D10}.chunk");
            await using var chunkRange = await container.OpenRangeReadAsync(chunkName, offsetInChunk, toRead, cancellationToken);
            await chunkRange.CopyToAsync(stream, cancellationToken);
            remaining -= toRead;
            currentOffset += toRead;
        }

        stream.Position = 0;
        return stream;
    }

    public ValueTask<Stream> OpenTransactionsReadStreamAsync(CancellationToken cancellationToken = default)
        => container.OpenReadAsync(new PreparedDocumentObjectName(PreparedDocumentFileNames.TransactionsFileName), cancellationToken);

    public async IAsyncEnumerable<PreparedDocumentSearchResult> SearchAsync(
        PreparedDocumentSearchQuery query,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        if (string.IsNullOrEmpty(query.Text) || query.MaxResults <= 0)
        {
            yield break;
        }

        if (query.Scope != PreparedDocumentSearchScope.AllText)
        {
            throw new NotSupportedException("Property-name and string-value scoped search require the path index and are not implemented by this storage engine yet.");
        }

        var startOffset = ParseContinuationToken(query.ContinuationToken);
        var sourceLength = Manifest.SourceLengthBytes == 0 ? Manifest.SourceLength : Manifest.SourceLengthBytes;
        if (startOffset >= sourceLength)
        {
            yield break;
        }

        var needle = Encoding.UTF8.GetBytes(query.Text);
        var comparison = query.IgnoreCase ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
        var emitted = 0;
        const int blockSize = 64 * 1024;
        var overlapChars = Math.Max(query.Text.Length - 1, 0);
        var absoluteOffset = startOffset;
        var carry = string.Empty;
        await using var source = await OpenSourceRangeAsync(startOffset, sourceLength - startOffset, cancellationToken);
        var buffer = ArrayPool<byte>.Shared.Rent(blockSize);
        try
        {
            while (emitted < query.MaxResults)
            {
                var read = await source.ReadAsync(buffer.AsMemory(0, blockSize), cancellationToken);
                if (read == 0)
                {
                    break;
                }

                var text = carry + Encoding.UTF8.GetString(buffer, 0, read);
                var scanBaseOffset = absoluteOffset - Encoding.UTF8.GetByteCount(carry);
                var scanIndex = 0;
                while (emitted < query.MaxResults)
                {
                    var matchIndex = text.IndexOf(query.Text, scanIndex, comparison);
                    if (matchIndex < 0)
                    {
                        break;
                    }

                    var matchOffset = scanBaseOffset + Encoding.UTF8.GetByteCount(text.AsSpan(0, matchIndex));
                    var endOffset = matchOffset + needle.Length;
                    var preview = BuildPreview(text, matchIndex, query.Text.Length);
                    yield return new PreparedDocumentSearchResult(DocumentId, Revision, matchOffset, endOffset, preview, JsonPointer: null);
                    emitted++;
                    scanIndex = matchIndex + Math.Max(query.Text.Length, 1);
                }

                carry = text.Length > overlapChars ? text[^overlapChars..] : text;
                absoluteOffset += read;
            }
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }

    public async ValueTask ExportAsync(Stream destination, JsonDocumentExportOptions options, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(destination);
        ArgumentNullException.ThrowIfNull(options);
        if (!destination.CanWrite)
        {
            throw new InvalidOperationException("Destination stream must be writable.");
        }

        if (Manifest.Transactions.Count > 0)
        {
            throw new NotSupportedException("Export cannot apply prepared document transactions yet.");
        }

        await using var source = await OpenSourceReadStreamAsync(cancellationToken);
        await source.CopyToAsync(destination, cancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        if (!disposed)
        {
            disposed = true;
            await lease.DisposeAsync();
        }
    }

    private IReadOnlyList<string> GetChunkNames()
    {
        var sourceLength = Manifest.SourceLengthBytes == 0 ? Manifest.SourceLength : Manifest.SourceLengthBytes;
        if (sourceLength == 0)
        {
            return [];
        }

        var chunkSize = Manifest.SourceChunkSizeBytes;
        var chunkCount = (int)((sourceLength + chunkSize - 1) / chunkSize);
        return Enumerable.Range(0, chunkCount).Select(static index => $"source/chunks/{index:D10}.chunk").ToArray();
    }

    private static long ParseContinuationToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return 0;
        }

        if (!long.TryParse(token, out var offset) || offset < 0)
        {
            throw new ArgumentException("Continuation token must be a non-negative byte offset.", nameof(token));
        }

        return offset;
    }

    private static string BuildPreview(string text, int matchIndex, int matchLength)
    {
        var start = Math.Max(0, matchIndex - 24);
        var end = Math.Min(text.Length, matchIndex + matchLength + 24);
        return text[start..end].Replace('\r', ' ').Replace('\n', ' ');
    }
}
