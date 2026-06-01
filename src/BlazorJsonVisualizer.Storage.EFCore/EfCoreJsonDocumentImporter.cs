using System.Text.Json;
using BlazorJsonVisualizer.PreparedDocuments;
using Microsoft.EntityFrameworkCore;

namespace BlazorJsonVisualizer.Storage.EFCore;

public sealed class EfCoreJsonDocumentImporter<TContext>(EfCorePreparedJsonDocumentStore<TContext> store) : IJsonDocumentImporter
    where TContext : DbContext, IBlazorJsonVisualizerStorageDbContext
{
    public async ValueTask<PreparedJsonDocumentInfo> ImportAsync(
        Stream source,
        JsonDocumentImportOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(options);

        if (!source.CanRead)
        {
            throw new InvalidOperationException("Source stream must be readable.");
        }

        var documentId = string.IsNullOrWhiteSpace(options.DocumentId)
            ? Guid.NewGuid().ToString("n")
            : options.DocumentId;
        var chunkSize = options.SourceChunkSizeBytes ?? EfCorePreparedJsonDocumentStore<TContext>.DefaultChunkSizeBytes;
        if (chunkSize <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(options), "Source chunk size must be greater than zero.");
        }

        Stream sourceToImport = source;
        MemoryStream? validatedBuffer = null;

        if (!options.AllowInvalidJson)
        {
            try
            {
                validatedBuffer = new MemoryStream();
                await source.CopyToAsync(validatedBuffer, cancellationToken);
                validatedBuffer.Position = 0;
                using var _ = await JsonDocument.ParseAsync(validatedBuffer, cancellationToken: cancellationToken);
                validatedBuffer.Position = 0;
                sourceToImport = validatedBuffer;
            }
            catch (JsonException exception)
            {
                validatedBuffer?.Dispose();
                throw new InvalidDataException("Source stream is not valid JSON.", exception);
            }
        }

        if (validatedBuffer is not null)
        {
            await using (validatedBuffer)
            {
                await store.ImportAsync(sourceToImport, documentId, chunkSize, cancellationToken);
            }
        }
        else
        {
            await store.ImportAsync(sourceToImport, documentId, chunkSize, cancellationToken);
        }

        await using (var context = store.CreateContext())
        {
            await context.PreparedJsonDocuments
                .Where(e => e.DocumentId == documentId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.SearchIndexState, options.BuildSearchIndex ? nameof(PreparedDocumentIndexState.Ready) : nameof(PreparedDocumentIndexState.Missing))
                    .SetProperty(e => e.PathIndexState, options.BuildPathIndex ? nameof(PreparedDocumentIndexState.Ready) : nameof(PreparedDocumentIndexState.Missing))
                    .SetProperty(e => e.UpdatedAt, DateTimeOffset.UtcNow), cancellationToken);
        }

        return await store.GetAsync(documentId, cancellationToken)
            ?? throw new InvalidOperationException($"Import failed for document '{documentId}'. Diagnostic: {EfCoreStorageDiagnostics.ImportFailed}");
    }
}
