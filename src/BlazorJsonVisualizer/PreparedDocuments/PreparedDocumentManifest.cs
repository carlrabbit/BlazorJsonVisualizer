using System.Text.Json.Serialization;

namespace BlazorJsonVisualizer.PreparedDocuments;

public sealed record PreparedDocumentManifest
{
    public int FormatVersion { get; init; } = 1;

    public required string DocumentId { get; init; }

    public long SourceLength { get; init; }

    public long SourceLengthBytes { get; init; }

    public string? SourceHash { get; init; }

    public string SourceEncoding { get; init; } = "utf-8";

    public int SourceChunkSizeBytes { get; init; }

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset UpdatedAt { get; init; }

    public int LatestRevision { get; init; } = 1;

    [JsonConverter(typeof(JsonStringEnumConverter<JsonDocumentPreparationState>))]
    public JsonDocumentPreparationState State { get; init; } = JsonDocumentPreparationState.Ready;

    public required PreparedDocumentManifestIndexes Indexes { get; init; }

    public required PreparedDocumentManifestTransactions Transactions { get; init; }
}

public sealed record PreparedDocumentManifestIndexes
{
    public required PreparedDocumentManifestIndexEntry Line { get; init; }

    public required PreparedDocumentManifestIndexEntry Structure { get; init; }

    public required PreparedDocumentManifestIndexEntry Search { get; init; }

    public required PreparedDocumentManifestIndexEntry Path { get; init; }
}

public sealed record PreparedDocumentManifestIndexEntry
{
    public int Version { get; init; } = 1;

    [JsonConverter(typeof(JsonStringEnumConverter<PreparedDocumentIndexState>))]
    public PreparedDocumentIndexState State { get; init; }
}

public sealed record PreparedDocumentManifestTransactions
{
    [JsonConverter(typeof(JsonStringEnumConverter<PreparedDocumentIndexState>))]
    public PreparedDocumentIndexState State { get; init; } = PreparedDocumentIndexState.Ready;

    public int Count { get; init; }

    public int LatestRevision { get; init; } = 1;
}
