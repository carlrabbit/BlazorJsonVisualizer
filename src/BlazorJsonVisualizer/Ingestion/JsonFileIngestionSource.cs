namespace BlazorJsonVisualizer.Ingestion;

public sealed class JsonFileIngestionSource : IJsonIngestionSource
{
    private readonly string path;

    public JsonFileIngestionSource(string path, string? displayName = null, string? contentType = "application/json")
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new ArgumentException("Source file path is required.", nameof(path));
        }

        this.path = path;
        DisplayName = string.IsNullOrWhiteSpace(displayName) ? Path.GetFileName(path) : displayName;
        ContentType = contentType;
        Length = TryGetLength(path);
    }

    public string DisplayName { get; }

    public long? Length { get; }

    public string? ContentType { get; }

    public ValueTask<Stream> OpenReadAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        Stream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 64 * 1024, useAsync: true);
        return ValueTask.FromResult(stream);
    }

    private static long? TryGetLength(string path)
    {
        try
        {
            return File.Exists(path) ? new FileInfo(path).Length : null;
        }
        catch (IOException)
        {
            return null;
        }
        catch (UnauthorizedAccessException)
        {
            return null;
        }
    }
}
