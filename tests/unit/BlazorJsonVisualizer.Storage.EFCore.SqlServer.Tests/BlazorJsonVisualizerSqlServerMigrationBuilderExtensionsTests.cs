using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Xunit;

namespace BlazorJsonVisualizer.Storage.EFCore.SqlServer.Tests;

public sealed class BlazorJsonVisualizerSqlServerMigrationBuilderExtensionsTests
{
    [Fact]
    public void AddSqlServer2022Optimizations_EmitsExpectedSqlOperations()
    {
        var migrationBuilder = new MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer");

        migrationBuilder.AddBlazorJsonVisualizerSqlServer2022Optimizations(schema: "bjv", tablePrefix: "JsonVisualizer");

        var sqlOperations = migrationBuilder.Operations.OfType<SqlOperation>().Select(operation => operation.Sql).ToArray();
        Assert.Equal(4, sqlOperations.Length);
        Assert.Contains(sqlOperations, sql => sql.Contains("IX_JsonVisualizerPreparedJsonDocuments_State_CreatedAt", StringComparison.Ordinal));
        Assert.Contains(sqlOperations, sql => sql.Contains("[bjv].[JsonVisualizerPreparedJsonDocumentSourceChunks]", StringComparison.Ordinal));
        Assert.DoesNotContain(sqlOperations, sql => sql.Contains("ProductMajorVersion", StringComparison.Ordinal));
    }

    [Fact]
    public void AddSqlServer2025Optimizations_EmitsVersionCheckAndAdditionalIndex()
    {
        var migrationBuilder = new MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer");

        migrationBuilder.AddBlazorJsonVisualizerSqlServer2025Optimizations(schema: "bjv", tablePrefix: "Bjv");

        var sqlOperations = migrationBuilder.Operations.OfType<SqlOperation>().Select(operation => operation.Sql).ToArray();
        Assert.Equal(6, sqlOperations.Length);
        Assert.Contains(sqlOperations, sql => sql.Contains("ProductMajorVersion", StringComparison.Ordinal));
        Assert.Contains(sqlOperations, sql => sql.Contains(EfCoreStorageDiagnostics.SqlServerOptimizationUnavailable, StringComparison.Ordinal));
        Assert.Contains(sqlOperations, sql => sql.Contains("IX_BjvPreparedJsonDocumentDiagnostics_DocumentId_JobId_CreatedAt", StringComparison.Ordinal));
    }

    [Fact]
    public void RemoveSqlServerOptimizations_EmitsDropStatements()
    {
        var migrationBuilder = new MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer");

        migrationBuilder.RemoveBlazorJsonVisualizerSqlServer2025Optimizations(schema: "custom", tablePrefix: "Prefix");

        var sqlOperations = migrationBuilder.Operations.OfType<SqlOperation>().Select(operation => operation.Sql).ToArray();
        Assert.Equal(5, sqlOperations.Length);
        Assert.Contains(sqlOperations, sql => sql.Contains("DROP INDEX [IX_PrefixPreparedJsonDocumentDiagnostics_DocumentId_JobId_CreatedAt]", StringComparison.Ordinal));
        Assert.Contains(sqlOperations, sql => sql.Contains("[custom].[PrefixPreparedJsonDocumentImportJobs]", StringComparison.Ordinal));
    }
}
