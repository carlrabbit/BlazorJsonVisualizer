using BlazorJsonVisualizer.Storage.EFCore.Entities;
using Microsoft.EntityFrameworkCore;

namespace BlazorJsonVisualizer.Storage.EFCore;

public interface IBlazorJsonVisualizerStorageDbContext
{
    DbSet<PreparedJsonDocumentEntity> PreparedJsonDocuments { get; }
    DbSet<PreparedJsonDocumentSourceChunkEntity> PreparedJsonDocumentSourceChunks { get; }
    DbSet<PreparedJsonDocumentIndexArtifactEntity> PreparedJsonDocumentIndexArtifacts { get; }
    DbSet<PreparedJsonDocumentStructuralNodeEntity> PreparedJsonDocumentStructuralNodes { get; }
    DbSet<PreparedJsonDocumentSearchEntryEntity> PreparedJsonDocumentSearchEntries { get; }
    DbSet<PreparedJsonDocumentTransactionEntity> PreparedJsonDocumentTransactions { get; }
    DbSet<PreparedJsonDocumentImportJobEntity> PreparedJsonDocumentImportJobs { get; }
    DbSet<PreparedJsonDocumentDiagnosticEntity> PreparedJsonDocumentDiagnostics { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
