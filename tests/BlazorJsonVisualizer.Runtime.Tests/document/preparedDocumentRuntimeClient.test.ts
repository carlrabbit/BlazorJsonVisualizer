import { createPreparedDocumentRuntimeClient } from "../../../src/BlazorJsonVisualizer.Runtime/runtime-blazor/src/preparedDocumentRuntimeClient.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

const calls: { methodName: string; args: unknown[] }[] = [];
const bridge = {
  async invokeMethodAsync<T>(methodName: string, ...args: unknown[]): Promise<T> {
    calls.push({ methodName, args });
    if (methodName === "OpenPreparedDocumentSessionAsync") {
      return {
        success: true,
        sessionId: "prepared-session",
        documentId: "prepared-document",
        revision: 1
      } as T;
    }

    if (methodName === "SearchPreparedDocumentAsync") {
      return {
        sessionId: "prepared-session",
        documentId: "prepared-document",
        revision: 1,
        results: [{ resultId: "r1", revision: 1, startByteOffset: 5, endByteOffset: 12, preview: "viewing" }]
      } as T;
    }

    if (methodName === "RevealPreparedLocationAsync") {
      return {
        success: true,
        sessionId: "prepared-session",
        documentId: "prepared-document",
        rowIndex: 3
      } as T;
    }

    return {} as T;
  }
};

const client = createPreparedDocumentRuntimeClient(bridge);

{
  const result = await client.openPreparedDocumentSession({
    sessionId: "prepared-session",
    documentId: "prepared-document"
  });
  assert(result.success === true, "open result success");
  assert(calls[0]?.methodName === "OpenPreparedDocumentSessionAsync", "open method name");
}

{
  const page = await client.searchPreparedDocument({ sessionId: "prepared-session", query: "viewing", maxResults: 5 });
  assert(page.results.length === 1, "search result page");
  assert(calls[1]?.methodName === "SearchPreparedDocumentAsync", "search method name");
}

{
  const reveal = await client.revealPreparedLocation({
    sessionId: "prepared-session",
    target: { kind: "jsonPointer", path: "/features/0" }
  });
  assert(reveal.success === true, "reveal success");
  assert(calls[2]?.methodName === "RevealPreparedLocationAsync", "reveal method name");
}

console.log("preparedDocumentRuntimeClient tests passed");
