namespace BlazorJsonVisualizer.Ingestion;

public interface IJsonIngestionSource
{
    string DisplayName { get; }

    long? Length { get; }

    string? ContentType { get; }

    ValueTask<Stream> OpenReadAsync(CancellationToken cancellationToken = default);
}
