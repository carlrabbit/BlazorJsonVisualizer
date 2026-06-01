namespace BlazorJsonVisualizer.Ingestion;

public enum JsonImportJobState
{
    Queued,
    OpeningSource,
    ReadingSource,
    WritingChunks,
    BuildingStructuralIndex,
    BuildingSearchIndex,
    BuildingPathIndex,
    Finalizing,
    Ready,
    Failed,
    Cancelled
}
