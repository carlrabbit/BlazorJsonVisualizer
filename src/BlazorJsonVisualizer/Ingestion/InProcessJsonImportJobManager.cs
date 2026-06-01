using System.Collections.Concurrent;
using System.Text.Json;
using BlazorJsonVisualizer.PreparedDocuments;

namespace BlazorJsonVisualizer.Ingestion;

public sealed class InProcessJsonImportJobManager(
    IJsonDocumentImporter importer,
    IPreparedJsonDocumentStore store) : IJsonImportJobManager
{
    private readonly ConcurrentDictionary<string, ImportJob> jobs = new(StringComparer.Ordinal);

    public ValueTask<JsonImportJobHandle> StartAsync(
        IJsonIngestionSource source,
        JsonImportRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        var jobId = Guid.NewGuid().ToString("n");
        var job = new ImportJob(jobId, request.DocumentId, source.Length);
        if (source.Length is null)
        {
            job.AddDiagnostic(new JsonImportDiagnostic(
                JsonImportDiagnosticSeverity.Warning,
                JsonImportDiagnosticCodes.UnknownLength,
                "Source length is unknown; progress percentage is unavailable."));
        }

        if (!jobs.TryAdd(jobId, job))
        {
            throw new InvalidOperationException($"Import job '{jobId}' already exists.");
        }

        job.Runner = Task.Run(() => RunJobAsync(job, source, request), CancellationToken.None);
        return ValueTask.FromResult(new JsonImportJobHandle(jobId, request.DocumentId, job.GetStatus()));
    }

    public ValueTask<JsonImportJobStatus?> GetStatusAsync(string jobId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return ValueTask.FromResult(jobs.TryGetValue(jobId, out var job) ? job.GetStatus() : null);
    }

    public async ValueTask<JsonImportResult> WaitForCompletionAsync(string jobId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!jobs.TryGetValue(jobId, out var job))
        {
            throw new KeyNotFoundException($"Import job '{jobId}' was not found.");
        }

        await job.Runner.WaitAsync(cancellationToken);
        return job.Result ?? throw new InvalidOperationException($"Import job '{jobId}' completed without a result.");
    }

    public ValueTask CancelAsync(string jobId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (jobs.TryGetValue(jobId, out var job))
        {
            job.Cancel();
        }

        return ValueTask.CompletedTask;
    }

    private async Task RunJobAsync(ImportJob job, IJsonIngestionSource source, JsonImportRequest request)
    {
        try
        {
            job.Update(JsonImportJobState.OpeningSource, "Opening source");
            await using var sourceStream = await OpenSourceStreamAsync(job, source, job.CancellationToken);

            job.Update(JsonImportJobState.ReadingSource, "Reading source");
            await using var encodingCheckedStream = await ValidateEncodingAndWrapAsync(job, source, sourceStream, job.CancellationToken);
            await using var progressStream = new ProgressReadStream(encodingCheckedStream, bytesRead => job.UpdateProgress(JsonImportJobState.WritingChunks, "Writing source chunks", bytesRead));

            var imported = await importer.ImportAsync(progressStream, request.ToDocumentImportOptions(), job.CancellationToken);

            job.Update(JsonImportJobState.Finalizing, "Finalizing prepared document");
            await using (await store.OpenAsync(imported.DocumentId, CancellationToken.None))
            {
                // Opening through the store verifies that the ready result is visible through the prepared-document abstraction.
            }

            var resultState = job.HasWarnings ? JsonImportResultState.SucceededWithWarnings : JsonImportResultState.Succeeded;
            job.Complete(JsonImportJobState.Ready, "Ready", new JsonImportResult(job.JobId, resultState, imported, job.GetDiagnostics()));
        }
        catch (OperationCanceledException) when (job.IsCancellationRequested)
        {
            var diagnostic = new JsonImportDiagnostic(
                JsonImportDiagnosticSeverity.Error,
                JsonImportDiagnosticCodes.Cancelled,
                "Import was cancelled before a ready prepared document was published.");
            job.AddDiagnostic(diagnostic);
            job.Complete(JsonImportJobState.Cancelled, "Cancelled", new JsonImportResult(job.JobId, JsonImportResultState.Cancelled, Diagnostics: job.GetDiagnostics(), FailureMessage: diagnostic.Message));
        }
        catch (InvalidDataException exception) when (exception.InnerException is JsonException jsonException)
        {
            var diagnostic = CreateInvalidJsonDiagnostic(jsonException);
            job.AddDiagnostic(diagnostic);
            job.Complete(JsonImportJobState.Failed, "Failed", new JsonImportResult(job.JobId, JsonImportResultState.Failed, Diagnostics: job.GetDiagnostics(), FailureMessage: diagnostic.Message));
        }
        catch (ArgumentException exception) when (IsDocumentIdentifierFailure(exception))
        {
            var diagnostic = new JsonImportDiagnostic(
                JsonImportDiagnosticSeverity.Error,
                JsonImportDiagnosticCodes.InvalidDocumentId,
                "Configured document identifier is invalid or already in use.");
            job.AddDiagnostic(diagnostic);
            job.Complete(JsonImportJobState.Failed, "Failed", new JsonImportResult(job.JobId, JsonImportResultState.Failed, Diagnostics: job.GetDiagnostics(), FailureMessage: diagnostic.Message));
        }
        catch (InvalidOperationException exception) when (IsDocumentIdentifierFailure(exception))
        {
            var diagnostic = new JsonImportDiagnostic(
                JsonImportDiagnosticSeverity.Error,
                JsonImportDiagnosticCodes.InvalidDocumentId,
                "Configured document identifier is invalid or already in use.");
            job.AddDiagnostic(diagnostic);
            job.Complete(JsonImportJobState.Failed, "Failed", new JsonImportResult(job.JobId, JsonImportResultState.Failed, Diagnostics: job.GetDiagnostics(), FailureMessage: diagnostic.Message));
        }
        catch (UnsupportedSourceEncodingException exception)
        {
            var diagnostic = new JsonImportDiagnostic(
                JsonImportDiagnosticSeverity.Error,
                JsonImportDiagnosticCodes.UnsupportedEncoding,
                exception.Message);
            job.AddDiagnostic(diagnostic);
            job.Complete(JsonImportJobState.Failed, "Failed", new JsonImportResult(job.JobId, JsonImportResultState.Failed, Diagnostics: job.GetDiagnostics(), FailureMessage: diagnostic.Message));
        }
        catch (Exception exception)
        {
            var code = job.State == JsonImportJobState.OpeningSource
                ? JsonImportDiagnosticCodes.SourceOpenFailed
                : JsonImportDiagnosticCodes.FinalizationFailed;
            var message = code == JsonImportDiagnosticCodes.SourceOpenFailed
                ? "Source could not be opened. Verify source permissions, existence, and lifecycle."
                : "Prepared document finalization failed. Retry import and inspect storage/provider logs if available.";
            var diagnostic = new JsonImportDiagnostic(JsonImportDiagnosticSeverity.Error, code, message);
            job.AddDiagnostic(diagnostic);
            job.Complete(JsonImportJobState.Failed, "Failed", new JsonImportResult(job.JobId, JsonImportResultState.Failed, Diagnostics: job.GetDiagnostics(), FailureMessage: exception.Message));
        }
    }

    private static async ValueTask<Stream> OpenSourceStreamAsync(ImportJob job, IJsonIngestionSource source, CancellationToken cancellationToken)
    {
        try
        {
            return await source.OpenReadAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (job.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new SourceOpenException("Source could not be opened.", exception);
        }
    }

    private static async ValueTask<Stream> ValidateEncodingAndWrapAsync(ImportJob job, IJsonIngestionSource source, Stream stream, CancellationToken cancellationToken)
    {
        if (HasUnsupportedCharset(source.ContentType))
        {
            throw new UnsupportedSourceEncodingException("Source content type declares an unsupported charset. Provide UTF-8 JSON.");
        }

        var prefix = new byte[4];
        var read = 0;
        while (read < prefix.Length)
        {
            var current = await stream.ReadAsync(prefix.AsMemory(read, prefix.Length - read), cancellationToken);
            if (current == 0)
            {
                break;
            }

            read += current;
        }

        if (StartsWith(prefix, read, [0xFF, 0xFE]) || StartsWith(prefix, read, [0xFE, 0xFF]) || StartsWith(prefix, read, [0x00, 0x00, 0xFE, 0xFF]) || StartsWith(prefix, read, [0xFF, 0xFE, 0x00, 0x00]))
        {
            throw new UnsupportedSourceEncodingException("Source encoding is unsupported. Provide UTF-8 JSON.");
        }

        if (StartsWith(prefix, read, [0xEF, 0xBB, 0xBF]))
        {
            job.AddDiagnostic(new JsonImportDiagnostic(
                JsonImportDiagnosticSeverity.Warning,
                JsonImportDiagnosticCodes.Utf8BomAccepted,
                "Source contains UTF-8 BOM; BOM was accepted and handled.",
                ByteOffset: 0));
            return new PrefixReadStream(stream, prefix.AsMemory(3, read - 3).ToArray());
        }

        return new PrefixReadStream(stream, prefix.AsMemory(0, read).ToArray());
    }

    private static bool StartsWith(byte[] value, int length, byte[] prefix)
    {
        if (length < prefix.Length)
        {
            return false;
        }

        for (var index = 0; index < prefix.Length; index++)
        {
            if (value[index] != prefix[index])
            {
                return false;
            }
        }

        return true;
    }

    private static bool HasUnsupportedCharset(string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return false;
        }

        foreach (var part in contentType.Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
        {
            var pieces = part.Split('=', 2, StringSplitOptions.TrimEntries);
            if (pieces.Length == 2 && string.Equals(pieces[0], "charset", StringComparison.OrdinalIgnoreCase))
            {
                var charset = pieces[1].Trim('"');
                return !string.Equals(charset, "utf-8", StringComparison.OrdinalIgnoreCase) && !string.Equals(charset, "utf8", StringComparison.OrdinalIgnoreCase);
            }
        }

        return false;
    }

    private static JsonImportDiagnostic CreateInvalidJsonDiagnostic(JsonException exception)
        => new(
            JsonImportDiagnosticSeverity.Error,
            JsonImportDiagnosticCodes.InvalidJson,
            "JSON is invalid and invalid JSON import is disabled. Fix the JSON source and import again.",
            Line: exception.LineNumber is null ? null : exception.LineNumber.Value + 1,
            Column: exception.BytePositionInLine is null ? null : exception.BytePositionInLine.Value + 1);

    private static bool IsDocumentIdentifierFailure(Exception exception)
        => exception.Message.Contains("document id", StringComparison.OrdinalIgnoreCase)
            || exception.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase);

    private sealed class ImportJob(string jobId, string? documentId, long? totalBytes)
    {
        private readonly object syncRoot = new();
        private readonly List<JsonImportDiagnostic> diagnostics = [];
        private readonly CancellationTokenSource cancellationTokenSource = new();
        private long bytesRead;
        private DateTimeOffset updatedAt = DateTimeOffset.UtcNow;
        private DateTimeOffset? completedAt;

        public string JobId => jobId;

        public JsonImportJobState State { get; private set; } = JsonImportJobState.Queued;

        public string Step { get; private set; } = "Queued";

        public DateTimeOffset StartedAt { get; } = DateTimeOffset.UtcNow;

        public CancellationToken CancellationToken => cancellationTokenSource.Token;

        public bool IsCancellationRequested => cancellationTokenSource.IsCancellationRequested;

        public bool HasWarnings
        {
            get
            {
                lock (syncRoot)
                {
                    return diagnostics.Any(static diagnostic => diagnostic.Severity == JsonImportDiagnosticSeverity.Warning);
                }
            }
        }

        public Task Runner { get; set; } = Task.CompletedTask;

        public JsonImportResult? Result { get; private set; }

        public void Cancel() => cancellationTokenSource.Cancel();

        public void Update(JsonImportJobState state, string step)
        {
            lock (syncRoot)
            {
                State = state;
                Step = step;
                updatedAt = DateTimeOffset.UtcNow;
            }
        }

        public void UpdateProgress(JsonImportJobState state, string step, long currentBytesRead)
        {
            lock (syncRoot)
            {
                State = state;
                Step = step;
                bytesRead = currentBytesRead;
                updatedAt = DateTimeOffset.UtcNow;
            }
        }

        public void AddDiagnostic(JsonImportDiagnostic diagnostic)
        {
            lock (syncRoot)
            {
                diagnostics.Add(diagnostic);
                updatedAt = DateTimeOffset.UtcNow;
            }
        }

        public IReadOnlyList<JsonImportDiagnostic> GetDiagnostics()
        {
            lock (syncRoot)
            {
                return diagnostics.ToArray();
            }
        }

        public JsonImportJobStatus GetStatus()
        {
            lock (syncRoot)
            {
                var fraction = totalBytes is > 0 ? Math.Min(1, (double)bytesRead / totalBytes.Value) : (double?)null;
                return new JsonImportJobStatus(
                    jobId,
                    documentId,
                    State,
                    Step,
                    new JsonImportProgress(bytesRead, totalBytes, fraction),
                    diagnostics.ToArray(),
                    StartedAt,
                    updatedAt,
                    completedAt);
            }
        }

        public void Complete(JsonImportJobState state, string step, JsonImportResult result)
        {
            lock (syncRoot)
            {
                State = state;
                Step = step;
                if (state == JsonImportJobState.Ready && totalBytes is not null)
                {
                    bytesRead = totalBytes.Value;
                }

                Result = result;
                completedAt = DateTimeOffset.UtcNow;
                updatedAt = completedAt.Value;
            }
        }
    }

    private sealed class ProgressReadStream(Stream inner, Action<long> progress) : Stream
    {
        private long bytesRead;

        public override bool CanRead => inner.CanRead;

        public override bool CanSeek => false;

        public override bool CanWrite => false;

        public override long Length => inner.Length;

        public override long Position
        {
            get => bytesRead;
            set => throw new NotSupportedException();
        }

        public override void Flush() => inner.Flush();

        public override int Read(byte[] buffer, int offset, int count)
        {
            var read = inner.Read(buffer, offset, count);
            Report(read);
            return read;
        }

        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            var read = await inner.ReadAsync(buffer, cancellationToken);
            Report(read);
            return read;
        }

        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        public override async ValueTask DisposeAsync() => await inner.DisposeAsync();

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                inner.Dispose();
            }
        }

        private void Report(int read)
        {
            if (read <= 0)
            {
                return;
            }

            bytesRead += read;
            progress(bytesRead);
        }
    }

    private sealed class PrefixReadStream(Stream inner, byte[] prefix) : Stream
    {
        private int prefixOffset;

        public override bool CanRead => inner.CanRead;

        public override bool CanSeek => false;

        public override bool CanWrite => false;

        public override long Length => inner.Length;

        public override long Position
        {
            get => inner.CanSeek ? Math.Max(0, inner.Position - (prefix.Length - prefixOffset)) : 0;
            set => throw new NotSupportedException();
        }

        public override void Flush() => inner.Flush();

        public override int Read(byte[] buffer, int offset, int count)
        {
            var copied = CopyPrefix(buffer.AsMemory(offset, count).Span);
            return copied > 0 ? copied : inner.Read(buffer, offset, count);
        }

        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            var copied = CopyPrefix(buffer.Span);
            return copied > 0 ? copied : await inner.ReadAsync(buffer, cancellationToken);
        }

        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        public override async ValueTask DisposeAsync() => await inner.DisposeAsync();

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                inner.Dispose();
            }
        }

        private int CopyPrefix(Span<byte> destination)
        {
            if (prefixOffset >= prefix.Length || destination.Length == 0)
            {
                return 0;
            }

            var copied = Math.Min(destination.Length, prefix.Length - prefixOffset);
            prefix.AsSpan(prefixOffset, copied).CopyTo(destination);
            prefixOffset += copied;
            return copied;
        }
    }

    private sealed class SourceOpenException(string message, Exception innerException) : Exception(message, innerException);

    private sealed class UnsupportedSourceEncodingException(string message) : Exception(message);
}
