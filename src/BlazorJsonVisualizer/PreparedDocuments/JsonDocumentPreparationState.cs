using System.Text.Json.Serialization;

namespace BlazorJsonVisualizer.PreparedDocuments;

[JsonConverter(typeof(JsonStringEnumConverter<JsonDocumentPreparationState>))]
public enum JsonDocumentPreparationState
{
    Importing,
    Ready,
    Failed,
    Deleting
}
