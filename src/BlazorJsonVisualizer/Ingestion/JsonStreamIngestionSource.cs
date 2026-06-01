namespace BlazorJsonVisualizer.Ingestion;

public sealed class JsonStreamIngestionSource : IJsonIngestionSource
{
    private readonly Stream stream;
    private readonly bool leaveOpen;

    public JsonStreamIngestionSource(
        Stream stream,
        string? displayName = null,
        long? length = null,
        string? contentType = null,
        bool leaveOpen = true)
    {
        ArgumentNullException.ThrowIfNull(stream);
        if (!stream.CanRead)
        {
            throw new ArgumentException("Source stream must be readable.", nameof(stream));
        }

        this.stream = stream;
        this.leaveOpen = leaveOpen;
        DisplayName = string.IsNullOrWhiteSpace(displayName) ? "JSON stream" : displayName;
        Length = length ?? TryGetLength(stream);
        ContentType = contentType;
    }

    public string DisplayName { get; }

    public long? Length { get; }

    public string? ContentType { get; }

    public ValueTask<Stream> OpenReadAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        Stream opened = leaveOpen ? new NonDisposingReadStream(stream) : stream;
        return ValueTask.FromResult(opened);
    }

    private static long? TryGetLength(Stream stream)
    {
        if (!stream.CanSeek)
        {
            return null;
        }

        try
        {
            return stream.Length;
        }
        catch (NotSupportedException)
        {
            return null;
        }
        catch (ObjectDisposedException)
        {
            return null;
        }
    }

    private sealed class NonDisposingReadStream(Stream inner) : Stream
    {
        public override bool CanRead => inner.CanRead;

        public override bool CanSeek => inner.CanSeek;

        public override bool CanWrite => false;

        public override long Length => inner.Length;

        public override long Position
        {
            get => inner.Position;
            set => inner.Position = value;
        }

        public override void Flush() => inner.Flush();

        public override int Read(byte[] buffer, int offset, int count) => inner.Read(buffer, offset, count);

        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
            => inner.ReadAsync(buffer, cancellationToken);

        public override long Seek(long offset, SeekOrigin origin) => inner.Seek(offset, origin);

        public override void SetLength(long value) => throw new NotSupportedException("The ingestion source stream is read-only.");

        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException("The ingestion source stream is read-only.");

        protected override void Dispose(bool disposing)
        {
            // The caller owns the wrapped stream when leaveOpen is true.
        }

        public override ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
