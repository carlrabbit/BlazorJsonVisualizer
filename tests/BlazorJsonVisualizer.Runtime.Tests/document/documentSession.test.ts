import {
  createDocumentSession,
  disposeDocumentSession
} from "../../../src/BlazorJsonVisualizer.Runtime/runtime-core/src/document/documentSession.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// Basic creation
{
  const session = createDocumentSession("s1", '{"a":1}');
  assert(session.id === "s1", "session id");
  assert(session.revision === 1, "initial revision");
  assert(session.mode === "readOnly", "default mode");
  assert(session.tokenCount > 0, "token count > 0");
  assert(session.rootNodeId !== undefined, "rootNodeId set");
}

// Tokens are stored
{
  const session = createDocumentSession("s2", "42");
  assert(session.tokens.length === 1, "one token for '42'");
  assert(session.tokens[0]?.kind === "number", "token kind number");
}

// StructuralIndex is populated
{
  const session = createDocumentSession("s3", "[1,2]");
  const root = session.structuralIndex.nodesById[session.rootNodeId];
  assert(root?.kind === "document", "root kind document");
}

// dispose does not throw
{
  const session = createDocumentSession("s4", "null");
  disposeDocumentSession(session);
  assert(true, "dispose does not throw");
}

// Editable mode
{
  const session = createDocumentSession("s5", "true", "editable");
  assert(session.mode === "editable", "editable mode");
}

// Empty source
{
  const session = createDocumentSession("s6", "");
  assert(session.tokenCount === 0, "empty source: no tokens");
  assert(session.rootNodeId !== undefined, "empty source: root still exists");
}

console.log("documentSession tests passed");
