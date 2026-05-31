namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed record PreparedDocumentSearchQuery(
    string Text,
    bool IgnoreCase = true,
    PreparedDocumentSearchScope Scope = PreparedDocumentSearchScope.AllText,
    int MaxResults = 100,
    string? ContinuationToken = null);

public enum PreparedDocumentSearchScope
{
    AllText,
    PropertyNames,
    StringValues
}

public sealed record PreparedDocumentSearchResult(
    string DocumentId,
    long Revision,
    long StartOffset,
    long EndOffset,
    string Preview,
    string? JsonPointer);
