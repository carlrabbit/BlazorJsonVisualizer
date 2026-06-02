import type {
  PreparedDocumentMetadataDto,
  PreparedFoldStateRequestDto,
  PreparedFoldStateResultDto,
  PreparedOpenRequestDto,
  PreparedEditCommandDto,
  PreparedEditResultDto,
  PreparedOpenResultDto,
  PreparedRevealRequestDto,
  PreparedRevealResultDto,
  PreparedRowsRequestDto,
  PreparedRowsResultDto,
  PreparedSearchRequestDto,
  PreparedSearchResultPageDto,
  PreparedTextRangeDto,
  PreparedTextRangeRequestDto
} from "../../runtime-core/index.js";

export interface PreparedDocumentDotNetBridge {
  invokeMethodAsync<T>(methodName: string, ...args: unknown[]): Promise<T>;
}

export interface PreparedDocumentRuntimeClient {
  openPreparedDocumentSession(request: PreparedOpenRequestDto): Promise<PreparedOpenResultDto>;
  getPreparedDocumentMetadata(sessionId: string): Promise<PreparedDocumentMetadataDto>;
  getPreparedRows(request: PreparedRowsRequestDto): Promise<PreparedRowsResultDto>;
  readPreparedTextRange(request: PreparedTextRangeRequestDto): Promise<PreparedTextRangeDto>;
  setPreparedFoldState(request: PreparedFoldStateRequestDto): Promise<PreparedFoldStateResultDto>;
  searchPreparedDocument(request: PreparedSearchRequestDto): Promise<PreparedSearchResultPageDto>;
  revealPreparedLocation(request: PreparedRevealRequestDto): Promise<PreparedRevealResultDto>;
  applyPreparedEdit(command: PreparedEditCommandDto): Promise<PreparedEditResultDto>;
  closePreparedDocumentSession(sessionId: string): Promise<void>;
}

export function createPreparedDocumentRuntimeClient(
  bridge: PreparedDocumentDotNetBridge
): PreparedDocumentRuntimeClient {
  return {
    openPreparedDocumentSession: (request) =>
      bridge.invokeMethodAsync<PreparedOpenResultDto>("OpenPreparedDocumentSessionAsync", request),
    getPreparedDocumentMetadata: (sessionId) =>
      bridge.invokeMethodAsync<PreparedDocumentMetadataDto>("GetPreparedDocumentMetadataAsync", sessionId),
    getPreparedRows: (request) => bridge.invokeMethodAsync<PreparedRowsResultDto>("GetPreparedRowsAsync", request),
    readPreparedTextRange: (request) =>
      bridge.invokeMethodAsync<PreparedTextRangeDto>("ReadPreparedTextRangeAsync", request),
    setPreparedFoldState: (request) =>
      bridge.invokeMethodAsync<PreparedFoldStateResultDto>("SetPreparedFoldStateAsync", request),
    searchPreparedDocument: (request) =>
      bridge.invokeMethodAsync<PreparedSearchResultPageDto>("SearchPreparedDocumentAsync", request),
    revealPreparedLocation: (request) =>
      bridge.invokeMethodAsync<PreparedRevealResultDto>("RevealPreparedLocationAsync", request),
    applyPreparedEdit: (command) => bridge.invokeMethodAsync<PreparedEditResultDto>("ApplyPreparedEditAsync", command),
    closePreparedDocumentSession: async (sessionId) => {
      await bridge.invokeMethodAsync("ClosePreparedDocumentSessionAsync", sessionId);
    }
  };
}
