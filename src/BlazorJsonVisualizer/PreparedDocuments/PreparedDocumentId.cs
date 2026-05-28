namespace BlazorJsonVisualizer.PreparedDocuments;

public readonly record struct PreparedDocumentId(string Value)
{
    public override string ToString() => Value;
}
