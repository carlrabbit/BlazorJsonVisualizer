using BlazorJsonVisualizer.Protocol;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed class JsonDocumentExportException : InvalidOperationException
{
    public JsonDocumentExportException(RuntimeDiagnosticDto diagnostic)
        : base(diagnostic.Message)
    {
        Diagnostic = diagnostic;
    }

    public RuntimeDiagnosticDto Diagnostic { get; }
}
