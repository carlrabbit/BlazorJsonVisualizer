using System.Text;
using Microsoft.EntityFrameworkCore.Migrations;

namespace BlazorJsonVisualizer.Storage.EFCore.SqlServer;

public static class BlazorJsonVisualizerSqlServerMigrationBuilderExtensions
{
    public static MigrationBuilder AddBlazorJsonVisualizerSqlServer2022Optimizations(
        this MigrationBuilder migrationBuilder,
        string schema = "bjv",
        string tablePrefix = "Bjv")
    {
        ArgumentNullException.ThrowIfNull(migrationBuilder);

        var names = new TableNames(schema, tablePrefix);
        migrationBuilder.Sql(CreateIndexIfMissingSql(
            names.Documents,
            $"IX_{names.Prefix}PreparedJsonDocuments_State_CreatedAt",
            "[State], [CreatedAt] DESC",
            includeColumns: "[DocumentId], [UpdatedAt]"));
        migrationBuilder.Sql(CreateIndexIfMissingSql(
            names.SourceChunks,
            $"IX_{names.Prefix}PreparedJsonDocumentSourceChunks_DocumentId_StartByteOffset",
            "[DocumentId], [StartByteOffset]",
            includeColumns: "[LengthBytes]"));
        migrationBuilder.Sql(CreateIndexIfMissingSql(
            names.SearchEntries,
            $"IX_{names.Prefix}PreparedJsonDocumentSearchEntries_DocumentId_Scope_StartByteOffset",
            "[DocumentId], [Scope], [StartByteOffset]",
            includeColumns: "[EndByteOffset], [NormalizedTerm]"));
        migrationBuilder.Sql(CreateIndexIfMissingSql(
            names.ImportJobs,
            $"IX_{names.Prefix}PreparedJsonDocumentImportJobs_State_UpdatedAt_DocumentId",
            "[State], [UpdatedAt] DESC",
            includeColumns: "[DocumentId], [JobId]"));

        return migrationBuilder;
    }

    public static MigrationBuilder RemoveBlazorJsonVisualizerSqlServer2022Optimizations(
        this MigrationBuilder migrationBuilder,
        string schema = "bjv",
        string tablePrefix = "Bjv")
    {
        ArgumentNullException.ThrowIfNull(migrationBuilder);

        var names = new TableNames(schema, tablePrefix);
        migrationBuilder.Sql(DropIndexIfExistsSql(names.Documents, $"IX_{names.Prefix}PreparedJsonDocuments_State_CreatedAt"));
        migrationBuilder.Sql(DropIndexIfExistsSql(names.SourceChunks, $"IX_{names.Prefix}PreparedJsonDocumentSourceChunks_DocumentId_StartByteOffset"));
        migrationBuilder.Sql(DropIndexIfExistsSql(names.SearchEntries, $"IX_{names.Prefix}PreparedJsonDocumentSearchEntries_DocumentId_Scope_StartByteOffset"));
        migrationBuilder.Sql(DropIndexIfExistsSql(names.ImportJobs, $"IX_{names.Prefix}PreparedJsonDocumentImportJobs_State_UpdatedAt_DocumentId"));

        return migrationBuilder;
    }

    public static MigrationBuilder AddBlazorJsonVisualizerSqlServer2025Optimizations(
        this MigrationBuilder migrationBuilder,
        string schema = "bjv",
        string tablePrefix = "Bjv")
    {
        ArgumentNullException.ThrowIfNull(migrationBuilder);

        migrationBuilder.AddBlazorJsonVisualizerSqlServer2022Optimizations(schema, tablePrefix);
        var names = new TableNames(schema, tablePrefix);
        migrationBuilder.Sql($"""
IF CAST(SERVERPROPERTY('ProductMajorVersion') AS int) < 17
BEGIN
    THROW 51000, 'BlazorJsonVisualizer SQL Server 2025 optimizations require SQL Server 2025 or later. Diagnostic: efcore.storage.sqlServer.optimizationUnavailable', 1;
END;
""");
        migrationBuilder.Sql(CreateIndexIfMissingSql(
            names.Diagnostics,
            $"IX_{names.Prefix}PreparedJsonDocumentDiagnostics_DocumentId_JobId_CreatedAt",
            "[DocumentId], [JobId], [CreatedAt] DESC",
            includeColumns: "[Severity], [Code]"));

        return migrationBuilder;
    }

    public static MigrationBuilder RemoveBlazorJsonVisualizerSqlServer2025Optimizations(
        this MigrationBuilder migrationBuilder,
        string schema = "bjv",
        string tablePrefix = "Bjv")
    {
        ArgumentNullException.ThrowIfNull(migrationBuilder);

        var names = new TableNames(schema, tablePrefix);
        migrationBuilder.Sql(DropIndexIfExistsSql(names.Diagnostics, $"IX_{names.Prefix}PreparedJsonDocumentDiagnostics_DocumentId_JobId_CreatedAt"));
        migrationBuilder.RemoveBlazorJsonVisualizerSqlServer2022Optimizations(schema, tablePrefix);
        return migrationBuilder;
    }

    private static string CreateIndexIfMissingSql(string qualifiedTableName, string indexName, string keyColumns, string? includeColumns = null)
    {
        var builder = new StringBuilder();
        builder.AppendLine($"IF OBJECT_ID(N'{qualifiedTableName}', N'U') IS NOT NULL");
        builder.AppendLine("AND NOT EXISTS (");
        builder.AppendLine("    SELECT 1");
        builder.AppendLine("    FROM sys.indexes");
        builder.AppendLine($"    WHERE name = N'{indexName}'");
        builder.AppendLine($"      AND object_id = OBJECT_ID(N'{qualifiedTableName}', N'U')");
        builder.AppendLine(")");
        builder.AppendLine("BEGIN");
        builder.Append($"    CREATE INDEX [{EscapeIdentifier(indexName)}] ON {qualifiedTableName} ({keyColumns})");
        if (!string.IsNullOrWhiteSpace(includeColumns))
        {
            builder.Append($" INCLUDE ({includeColumns})");
        }

        builder.AppendLine(";");
        builder.AppendLine("END;");
        return builder.ToString();
    }

    private static string DropIndexIfExistsSql(string qualifiedTableName, string indexName)
        => $"""
IF OBJECT_ID(N'{qualifiedTableName}', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'{indexName}'
      AND object_id = OBJECT_ID(N'{qualifiedTableName}', N'U')
)
BEGIN
    DROP INDEX [{EscapeIdentifier(indexName)}] ON {qualifiedTableName};
END;
""";

    private static string EscapeIdentifier(string value) => value.Replace("]", "]]", StringComparison.Ordinal);

    private readonly record struct TableNames(string Schema, string Prefix)
    {
        public string Documents => $"[{EscapeIdentifier(Schema)}].[{EscapeIdentifier(Prefix)}PreparedJsonDocuments]";
        public string SourceChunks => $"[{EscapeIdentifier(Schema)}].[{EscapeIdentifier(Prefix)}PreparedJsonDocumentSourceChunks]";
        public string SearchEntries => $"[{EscapeIdentifier(Schema)}].[{EscapeIdentifier(Prefix)}PreparedJsonDocumentSearchEntries]";
        public string ImportJobs => $"[{EscapeIdentifier(Schema)}].[{EscapeIdentifier(Prefix)}PreparedJsonDocumentImportJobs]";
        public string Diagnostics => $"[{EscapeIdentifier(Schema)}].[{EscapeIdentifier(Prefix)}PreparedJsonDocumentDiagnostics]";
    }
}
