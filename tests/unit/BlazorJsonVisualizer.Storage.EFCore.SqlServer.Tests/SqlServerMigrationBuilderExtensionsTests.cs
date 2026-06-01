using BlazorJsonVisualizer.Storage.EFCore.SqlServer;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Xunit;

namespace BlazorJsonVisualizer.Storage.EFCore.SqlServer.Tests;

public sealed class SqlServerMigrationBuilderExtensionsTests
{
    [Fact]
    public void AddBlazorJsonVisualizerSqlServer2022Optimizations_NullBuilder_Throws()
    {
        var exception = Assert.Throws<ArgumentNullException>(
            () => ((MigrationBuilder)null!).AddBlazorJsonVisualizerSqlServer2022Optimizations());
        Assert.Equal("migrationBuilder", exception.ParamName);
    }

    [Fact]
    public void RemoveBlazorJsonVisualizerSqlServer2022Optimizations_NullBuilder_Throws()
    {
        var exception = Assert.Throws<ArgumentNullException>(
            () => ((MigrationBuilder)null!).RemoveBlazorJsonVisualizerSqlServer2022Optimizations());
        Assert.Equal("migrationBuilder", exception.ParamName);
    }

    [Fact]
    public void AddBlazorJsonVisualizerSqlServer2025Optimizations_NullBuilder_Throws()
    {
        var exception = Assert.Throws<ArgumentNullException>(
            () => ((MigrationBuilder)null!).AddBlazorJsonVisualizerSqlServer2025Optimizations());
        Assert.Equal("migrationBuilder", exception.ParamName);
    }

    [Fact]
    public void RemoveBlazorJsonVisualizerSqlServer2025Optimizations_NullBuilder_Throws()
    {
        var exception = Assert.Throws<ArgumentNullException>(
            () => ((MigrationBuilder)null!).RemoveBlazorJsonVisualizerSqlServer2025Optimizations());
        Assert.Equal("migrationBuilder", exception.ParamName);
    }

    [Fact]
    public void AddBlazorJsonVisualizerSqlServer2022Optimizations_DefaultArgs_GeneratesSqlOperations()
    {
        var builder = new MigrationBuilder(activeProvider: "Microsoft.EntityFrameworkCore.SqlServer");
        builder.AddBlazorJsonVisualizerSqlServer2022Optimizations();

        Assert.NotEmpty(builder.Operations);
        var sqlText = string.Concat(builder.Operations.OfType<SqlOperation>().Select(o => o.Sql));
        Assert.Contains("BjvPreparedJsonDocuments", sqlText, StringComparison.Ordinal);
        Assert.Contains("BjvPreparedJsonDocumentSourceChunks", sqlText, StringComparison.Ordinal);
    }

    [Fact]
    public void RemoveBlazorJsonVisualizerSqlServer2022Optimizations_DefaultArgs_GeneratesDropOperations()
    {
        var builder = new MigrationBuilder(activeProvider: "Microsoft.EntityFrameworkCore.SqlServer");
        builder.RemoveBlazorJsonVisualizerSqlServer2022Optimizations();

        Assert.NotEmpty(builder.Operations);
        var sqlText = string.Concat(builder.Operations.OfType<SqlOperation>().Select(o => o.Sql));
        Assert.Contains("DROP INDEX", sqlText, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void AddBlazorJsonVisualizerSqlServer2022Optimizations_CustomPrefixAndSchema_UsesCustomValues()
    {
        var builder = new MigrationBuilder(activeProvider: "Microsoft.EntityFrameworkCore.SqlServer");
        builder.AddBlazorJsonVisualizerSqlServer2022Optimizations(schema: "myschema", tablePrefix: "App");

        var sqlText = string.Concat(builder.Operations.OfType<SqlOperation>().Select(o => o.Sql));
        Assert.Contains("[myschema].", sqlText, StringComparison.Ordinal);
        Assert.Contains("AppPreparedJsonDocuments", sqlText, StringComparison.Ordinal);
    }

    [Fact]
    public void AddBlazorJsonVisualizerSqlServer2022Optimizations_ReturnsBuilderForChaining()
    {
        var builder = new MigrationBuilder(activeProvider: "Microsoft.EntityFrameworkCore.SqlServer");
        var returned = builder.AddBlazorJsonVisualizerSqlServer2022Optimizations();
        Assert.Same(builder, returned);
    }

    [Fact]
    public void RemoveBlazorJsonVisualizerSqlServer2022Optimizations_ReturnsBuilderForChaining()
    {
        var builder = new MigrationBuilder(activeProvider: "Microsoft.EntityFrameworkCore.SqlServer");
        var returned = builder.RemoveBlazorJsonVisualizerSqlServer2022Optimizations();
        Assert.Same(builder, returned);
    }

    [Fact]
    public void AddBlazorJsonVisualizerSqlServer2025Optimizations_IncludesAll2022Operations()
    {
        var builder2022 = new MigrationBuilder(activeProvider: "Microsoft.EntityFrameworkCore.SqlServer");
        builder2022.AddBlazorJsonVisualizerSqlServer2022Optimizations();
        var sql2022 = string.Concat(builder2022.Operations.OfType<SqlOperation>().Select(o => o.Sql));

        var builder2025 = new MigrationBuilder(activeProvider: "Microsoft.EntityFrameworkCore.SqlServer");
        builder2025.AddBlazorJsonVisualizerSqlServer2025Optimizations();
        var sql2025 = string.Concat(builder2025.Operations.OfType<SqlOperation>().Select(o => o.Sql));

        // The 2025 extension builds on 2022, so at minimum it produces more SQL.
        Assert.True(builder2025.Operations.Count >= builder2022.Operations.Count);
        Assert.Contains("BjvPreparedJsonDocuments", sql2025, StringComparison.Ordinal);
    }

    [Fact]
    public void Add2022And2025_ProduceDistinctIndexNames_NoNameCollisions()
    {
        var builder = new MigrationBuilder(activeProvider: "Microsoft.EntityFrameworkCore.SqlServer");
        builder.AddBlazorJsonVisualizerSqlServer2022Optimizations();

        var allSqlOps = builder.Operations.OfType<SqlOperation>().Select(o => o.Sql).ToList();
        var indexNames = allSqlOps
            .SelectMany(sql =>
            {
                var names = new List<string>();
                var idx = 0;
                while ((idx = sql.IndexOf("CREATE NONCLUSTERED INDEX", idx, StringComparison.OrdinalIgnoreCase)) >= 0)
                {
                    var nameStart = sql.IndexOf('[', idx);
                    var nameEnd = sql.IndexOf(']', nameStart + 1);
                    if (nameStart >= 0 && nameEnd > nameStart)
                    {
                        names.Add(sql[(nameStart + 1)..nameEnd]);
                    }

                    idx++;
                }

                return names;
            })
            .ToList();

        Assert.Equal(indexNames.Count, indexNames.Distinct().Count());
    }
}
