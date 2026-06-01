namespace BlazorJsonVisualizer.Ingestion;

public static class JsonImportDiagnosticCodes
{
    public const string SourceOpenFailed = "BJV-INGEST-001";
    public const string UnsupportedEncoding = "BJV-INGEST-002";
    public const string InvalidJson = "BJV-INGEST-003";
    public const string UnknownLength = "BJV-INGEST-004";
    public const string SearchIndexWarning = "BJV-INGEST-005";
    public const string PathIndexWarning = "BJV-INGEST-006";
    public const string Cancelled = "BJV-INGEST-007";
    public const string FinalizationFailed = "BJV-INGEST-008";
    public const string Utf8BomAccepted = "BJV-INGEST-009";
    public const string InvalidDocumentId = "BJV-INGEST-010";
}
