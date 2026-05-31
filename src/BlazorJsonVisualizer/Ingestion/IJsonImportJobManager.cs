namespace BlazorJsonVisualizer.Ingestion;

public interface IJsonImportJobManager
{
    ValueTask<JsonImportJobHandle> StartAsync(
        IJsonIngestionSource source,
        JsonImportRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<JsonImportJobStatus?> GetStatusAsync(
        string jobId,
        CancellationToken cancellationToken = default);

    ValueTask<JsonImportResult> WaitForCompletionAsync(
        string jobId,
        CancellationToken cancellationToken = default);

    ValueTask CancelAsync(
        string jobId,
        CancellationToken cancellationToken = default);
}
