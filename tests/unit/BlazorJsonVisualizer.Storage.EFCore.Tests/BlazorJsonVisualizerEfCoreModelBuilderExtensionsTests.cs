using BlazorJsonVisualizer.Storage.EFCore.Entities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BlazorJsonVisualizer.Storage.EFCore.Tests;

public sealed class BlazorJsonVisualizerEfCoreModelBuilderExtensionsTests
{
    [Fact]
    public void UseBlazorJsonVisualizerPreparedDocumentStorage_ConfiguresExpectedTablesAndIndexes()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<TestStorageDbContext>()
            .UseSqlite(connection)
            .Options;

        using var context = new TestStorageDbContext(options);
        var documentEntity = context.Model.FindEntityType(typeof(PreparedJsonDocumentEntity));
        Assert.NotNull(documentEntity);
        Assert.Equal("BjvPreparedJsonDocuments", documentEntity!.GetTableName());
        Assert.Contains(documentEntity.GetIndexes(), index => index.GetDatabaseName() == "IX_BjvPreparedJsonDocuments_State");
        Assert.True(documentEntity.FindProperty(nameof(PreparedJsonDocumentEntity.ConcurrencyToken))!.IsConcurrencyToken);

        var chunkEntity = context.Model.FindEntityType(typeof(PreparedJsonDocumentSourceChunkEntity));
        Assert.NotNull(chunkEntity);
        Assert.Contains(chunkEntity!.GetIndexes(), index => index.GetDatabaseName() == "IX_BjvPreparedJsonDocumentSourceChunks_DocumentId_ChunkIndex" && index.IsUnique);

        var artifactEntity = context.Model.FindEntityType(typeof(PreparedJsonDocumentIndexArtifactEntity));
        Assert.NotNull(artifactEntity);
        Assert.Contains(artifactEntity!.GetIndexes(), index => index.GetDatabaseName() == "IX_BjvPreparedJsonDocumentIndexArtifacts_DocumentId_IndexName" && index.IsUnique);
    }

    [Fact]
    public void UseBlazorJsonVisualizerPreparedDocumentStorage_AppliesCustomSchemaAndPrefix()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<CustomPrefixDbContext>()
            .UseSqlite(connection)
            .Options;

        using var context = new CustomPrefixDbContext(options);
        var documentEntity = context.Model.FindEntityType(typeof(PreparedJsonDocumentEntity));
        Assert.NotNull(documentEntity);
        Assert.Equal("custom", documentEntity!.GetSchema());
        Assert.Equal("JsonVisualizerPreparedJsonDocuments", documentEntity.GetTableName());
    }

    [Fact]
    public void UseBlazorJsonVisualizerPreparedDocumentStorage_NullModelBuilder_Throws()
    {
        var exception = Assert.Throws<ArgumentNullException>(
            () => ((ModelBuilder)null!).UseBlazorJsonVisualizerPreparedDocumentStorage());
        Assert.Equal("modelBuilder", exception.ParamName);
    }

    private sealed class CustomPrefixDbContext(DbContextOptions<CustomPrefixDbContext> options)
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
            modelBuilder.UseBlazorJsonVisualizerPreparedDocumentStorage(o =>
            {
                o.Schema = "custom";
                o.TablePrefix = "JsonVisualizer";
            });
        }
    }
}
