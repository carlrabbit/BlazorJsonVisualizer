using BlazorJsonVisualizer.Protocol;

namespace BlazorJsonVisualizer.PreparedDocuments;

public interface IPreparedDocumentRuntimeBridge
{
    ValueTask<PreparedOpenResultDto> OpenAsync(
        PreparedOpenRequestDto request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedDocumentMetadataDto> GetMetadataAsync(
        string sessionId,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedTextRangeDto> ReadTextRangeAsync(
        PreparedTextRangeRequestDto request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedRowsResultDto> GetRowsAsync(
        PreparedRowsRequestDto request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedFoldStateResultDto> SetFoldStateAsync(
        PreparedFoldStateRequestDto request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedSearchResultPageDto> SearchAsync(
        PreparedSearchRequestDto request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedRevealResultDto> RevealAsync(
        PreparedRevealRequestDto request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedCloseResultDto> CloseAsync(
        string sessionId,
        CancellationToken cancellationToken = default);
}
