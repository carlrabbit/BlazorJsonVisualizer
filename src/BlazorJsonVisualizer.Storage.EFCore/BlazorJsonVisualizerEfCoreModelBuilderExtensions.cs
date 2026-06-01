using BlazorJsonVisualizer.Storage.EFCore.Entities;
using Microsoft.EntityFrameworkCore;

namespace BlazorJsonVisualizer.Storage.EFCore;

public static class BlazorJsonVisualizerEfCoreModelBuilderExtensions
{
    public static ModelBuilder UseBlazorJsonVisualizerPreparedDocumentStorage(
        this ModelBuilder modelBuilder,
        Action<BlazorJsonVisualizerEfCoreStorageModelOptions>? configure = null)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        var options = new BlazorJsonVisualizerEfCoreStorageModelOptions();
        configure?.Invoke(options);

        var prefix = string.IsNullOrEmpty(options.TablePrefix) ? string.Empty : options.TablePrefix;
        var schema = options.Schema;

        modelBuilder.Entity<PreparedJsonDocumentEntity>(entity =>
        {
            entity.ToTable($"{prefix}PreparedJsonDocuments", schema);
            entity.HasKey(e => e.DocumentId);
            entity.Property(e => e.DocumentId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.State).HasMaxLength(32).IsRequired();
            entity.Property(e => e.SourceHash).HasMaxLength(128);
            entity.Property(e => e.SourceEncoding).HasMaxLength(32).IsRequired();
            entity.Property(e => e.LineIndexState).HasMaxLength(32).IsRequired();
            entity.Property(e => e.StructureIndexState).HasMaxLength(32).IsRequired();
            entity.Property(e => e.SearchIndexState).HasMaxLength(32).IsRequired();
            entity.Property(e => e.PathIndexState).HasMaxLength(32).IsRequired();
            entity.Property(e => e.TransactionState).HasMaxLength(32).IsRequired();
            entity.Property(e => e.ConcurrencyToken).IsRowVersion();
            entity.HasIndex(e => e.State).HasDatabaseName($"IX_{prefix}PreparedJsonDocuments_State");
        });

        modelBuilder.Entity<PreparedJsonDocumentSourceChunkEntity>(entity =>
        {
            entity.ToTable($"{prefix}PreparedJsonDocumentSourceChunks", schema);
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Content).IsRequired();
            entity.HasIndex(e => new { e.DocumentId, e.ChunkIndex })
                .IsUnique()
                .HasDatabaseName($"IX_{prefix}PreparedJsonDocumentSourceChunks_DocumentId_ChunkIndex");
        });

        modelBuilder.Entity<PreparedJsonDocumentIndexArtifactEntity>(entity =>
        {
            entity.ToTable($"{prefix}PreparedJsonDocumentIndexArtifacts", schema);
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.IndexName).HasMaxLength(64).IsRequired();
            entity.Property(e => e.Payload).IsRequired();
            entity.HasIndex(e => new { e.DocumentId, e.IndexName })
                .IsUnique()
                .HasDatabaseName($"IX_{prefix}PreparedJsonDocumentIndexArtifacts_DocumentId_IndexName");
        });

        modelBuilder.Entity<PreparedJsonDocumentStructuralNodeEntity>(entity =>
        {
            entity.ToTable($"{prefix}PreparedJsonDocumentStructuralNodes", schema);
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.NodeType).HasMaxLength(32).IsRequired();
            entity.Property(e => e.JsonPointer).HasMaxLength(2048);
            entity.Property(e => e.PropertyName).HasMaxLength(1024);
            entity.HasIndex(e => e.DocumentId)
                .HasDatabaseName($"IX_{prefix}PreparedJsonDocumentStructuralNodes_DocumentId");
        });

        modelBuilder.Entity<PreparedJsonDocumentSearchEntryEntity>(entity =>
        {
            entity.ToTable($"{prefix}PreparedJsonDocumentSearchEntries", schema);
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.NormalizedTerm).HasMaxLength(512).IsRequired();
            entity.Property(e => e.Scope).HasMaxLength(32).IsRequired();
            entity.Property(e => e.Preview).HasMaxLength(512);
            entity.HasIndex(e => new { e.DocumentId, e.NormalizedTerm, e.Scope })
                .HasDatabaseName($"IX_{prefix}PreparedJsonDocumentSearchEntries_DocumentId_Term_Scope");
        });

        modelBuilder.Entity<PreparedJsonDocumentTransactionEntity>(entity =>
        {
            entity.ToTable($"{prefix}PreparedJsonDocumentTransactions", schema);
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.OperationType).HasMaxLength(64).IsRequired();
            entity.HasIndex(e => new { e.DocumentId, e.TransactionIndex })
                .IsUnique()
                .HasDatabaseName($"IX_{prefix}PreparedJsonDocumentTransactions_DocumentId_Index");
        });

        modelBuilder.Entity<PreparedJsonDocumentImportJobEntity>(entity =>
        {
            entity.ToTable($"{prefix}PreparedJsonDocumentImportJobs", schema);
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.JobId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.DocumentId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.State).HasMaxLength(32).IsRequired();
            entity.Property(e => e.FailureMessage).HasMaxLength(2048);
            entity.HasIndex(e => e.JobId).IsUnique()
                .HasDatabaseName($"IX_{prefix}PreparedJsonDocumentImportJobs_JobId");
            entity.HasIndex(e => new { e.State, e.UpdatedAt })
                .HasDatabaseName($"IX_{prefix}PreparedJsonDocumentImportJobs_State_UpdatedAt");
        });

        modelBuilder.Entity<PreparedJsonDocumentDiagnosticEntity>(entity =>
        {
            entity.ToTable($"{prefix}PreparedJsonDocumentDiagnostics", schema);
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DocumentId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.JobId).HasMaxLength(256);
            entity.Property(e => e.Code).HasMaxLength(128).IsRequired();
            entity.Property(e => e.Severity).HasMaxLength(32).IsRequired();
            entity.Property(e => e.Message).HasMaxLength(2048).IsRequired();
            entity.HasIndex(e => e.DocumentId)
                .HasDatabaseName($"IX_{prefix}PreparedJsonDocumentDiagnostics_DocumentId");
        });

        return modelBuilder;
    }
}
