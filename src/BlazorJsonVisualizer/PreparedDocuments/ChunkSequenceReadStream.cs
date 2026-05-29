using BlazorJsonVisualizer.Storage;

namespace BlazorJsonVisualizer.PreparedDocuments;

internal sealed class ChunkSequenceReadStream(
    PreparedDocumentContainer container,
    IReadOnlyList<string> chunkNames,
    CancellationToken cancellationToken) : Stream
{
    private int chunkIndex;
    private Stream? currentChunk;

    public override bool CanRead => true;
    public override bool CanSeek => false;
    public override bool CanWrite => false;
    public override long Length => throw new NotSupportedException();
    public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }

    public override void Flush() { }

    public override int Read(byte[] buffer, int offset, int count)
        => ReadAsync(buffer.AsMemory(offset, count), CancellationToken.None).AsTask().GetAwaiter().GetResult();

    public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
    {
        while (true)
        {
            var chunk = await GetCurrentChunkAsync(cancellationToken);
            if (chunk is null)
            {
                return 0;
            }

            var read = await chunk.ReadAsync(buffer, cancellationToken);
            if (read > 0)
            {
                return read;
            }

            await chunk.DisposeAsync();
            currentChunk = null;
            chunkIndex++;
        }
    }

    public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

    public override void SetLength(long value) => throw new NotSupportedException();

    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            currentChunk?.Dispose();
        }

        base.Dispose(disposing);
    }

    public override async ValueTask DisposeAsync()
    {
        if (currentChunk is not null)
        {
            await currentChunk.DisposeAsync();
        }

        await base.DisposeAsync();
    }

    private async ValueTask<Stream?> GetCurrentChunkAsync(CancellationToken readCancellationToken)
    {
        readCancellationToken.ThrowIfCancellationRequested();
        cancellationToken.ThrowIfCancellationRequested();
        if (currentChunk is not null)
        {
            return currentChunk;
        }

        if (chunkIndex >= chunkNames.Count)
        {
            return null;
        }

        currentChunk = await container.OpenReadAsync(new PreparedDocumentObjectName(chunkNames[chunkIndex]), readCancellationToken);
        return currentChunk;
    }
}
