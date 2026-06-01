using BlazorJsonVisualizer.Storage.EFCore.Entities;
using Microsoft.EntityFrameworkCore;

namespace BlazorJsonVisualizer.Storage.EFCore.Tests;

public class TestStorageDbContext(DbContextOptions<TestStorageDbContext> options)
    : DbContext(options), IBlazorJsonVisualizerStorageDbContext
{
    public DbSet<PreparedJsonDocumentEntity> PreparedJsonDocuments => Set<PreparedJsonDocumentEntity>();
    public DbSet<PreparedJsonDocumentSourceChunkEntity> PreparedJsonDocumentSourceChunks => Set<PreparedJsonDocumentSourceChunkEntity>();
    public DbSet<PreparedJsonDocumentIndexArtifactEntity> PreparedJsonDocumentIndexArtifacts => Set<PreparedJsonDocumentIndexArtifactEntity>();
    public DbSet<PreparedJsonDocumentStructuralNodeEntity> PreparedJsonDocumentStructuralNodes => Set<PreparedJsonDocumentStructuralNodeEntity>();
    public DbSet<PreparedJsonDocumentSearchEntryEntity> PreparedJsonDocumentSearchEntries => Set<PreparedJsonDocumentSearchEntryEntity>();
    public DbSet<PreparedJsonDocumentTransactionEntity> PreparedJsonDocumentTransactions => Set<PreparedJsonDocumentTransactionEntity>();
    public DbSet<PreparedJsonDocumentImportJobEntity> PreparedJsonDocumentImportJobs => Set<PreparedJsonDocumentImportJobEntity>();
    public DbSet<PreparedJsonDocumentDiagnosticEntity> PreparedJsonDocumentDiagnostics => Set<PreparedJsonDocumentDiagnosticEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseBlazorJsonVisualizerPreparedDocumentStorage();
    }
}
