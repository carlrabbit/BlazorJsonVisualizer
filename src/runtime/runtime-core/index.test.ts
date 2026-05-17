import {
  findNodeIdByPath,
  listChildNodeIds,
  parseJsonDocument,
  type DocumentSessionRecord,
  type StructuralIndexDocument,
  type StructuralNodeRecord,
  RUNTIME_PROTOCOL_VERSION,
  SessionRegistry,
  toggleFoldInDocument
} from "./index.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(action: () => void, message: string): void {
  let threw = false;

  try {
    action();
  } catch {
    threw = true;
  }

  assert(threw, message);
}

function requireDocument(document: StructuralIndexDocument | undefined): StructuralIndexDocument {
  if (document === undefined) {
    throw new Error("document should be defined");
  }

  return document;
}

function requireNode(
  document: StructuralIndexDocument,
  nodeId: string | undefined,
  message: string
): StructuralNodeRecord {
  if (nodeId === undefined) {
    throw new Error(message);
  }

  const node = document.nodesById[nodeId];
  if (node === undefined) {
    throw new Error(message);
  }

  return node;
}

function requireSession(session: DocumentSessionRecord | undefined): DocumentSessionRecord {
  if (session === undefined) {
    throw new Error("session should be defined");
  }

  return session;
}

function parserBuildsStructuralIndexForObjectDocument(): void {
  const result = parseJsonDocument('{"name":"Widget","active":true}');
  assert(result.document !== undefined, "object document should parse");

  const document = requireDocument(result.document);
  const rootNode = requireNode(document, document.rootNodeId, "root node should exist");
  const propertyNodeIds = listChildNodeIds(document, document.rootNodeId);
  const nameProperty = requireNode(document, propertyNodeIds[0], "first property should exist");
  const activeProperty = requireNode(document, propertyNodeIds[1], "second property should exist");
  const nameValue = requireNode(document, nameProperty.firstChildId, "name value should exist");
  const activeValue = requireNode(document, activeProperty.firstChildId, "active value should exist");

  assert(rootNode.kind === "object", "root node should be an object");
  assert(rootNode.foldable, "object nodes should be foldable");
  assert(propertyNodeIds.length === 2, "object should expose property nodes as children");
  assert(nameProperty.kind === "property", "first child should be a property node");
  assert(nameProperty.path === "$.name", "property path should include the object member name");
  assert(nameValue.kind === "string", "property value should be a string node");
  assert(nameValue.scalarValue === "Widget", "string node should carry decoded scalar value");
  assert(activeValue.kind === "boolean", "second property value should be a boolean node");
  assert(activeValue.scalarValue === true, "boolean value should be preserved");
}

function parserBuildsStructuralIndexForArrayDocument(): void {
  const result = parseJsonDocument('[1,false,null]');
  assert(result.document !== undefined, "array document should parse");

  const document = requireDocument(result.document);
  const rootNode = requireNode(document, document.rootNodeId, "root node should exist");
  const itemNodeIds = listChildNodeIds(document, document.rootNodeId);

  assert(rootNode.kind === "array", "root node should be an array");
  assert(itemNodeIds.length === 3, "array should expose item nodes as children");
  assert(requireNode(document, itemNodeIds[0], "first item should exist").kind === "number", "first item should be a number node");
  assert(requireNode(document, itemNodeIds[1], "second item should exist").kind === "boolean", "second item should be a boolean node");
  assert(requireNode(document, itemNodeIds[2], "third item should exist").kind === "null", "third item should be a null node");
  assert(requireNode(document, itemNodeIds[2], "third item should exist").path === "$[2]", "array item path should include the array index");
}

function parserBuildsStructuralIndexForNestedDocument(): void {
  const result = parseJsonDocument('{"items":[{"name":"alpha"}]}');
  assert(result.document !== undefined, "nested document should parse");

  const document = requireDocument(result.document);
  const itemsNodeId = findNodeIdByPath(document, "$.items");
  const firstItemNodeId = findNodeIdByPath(document, "$.items[0]");
  const nameNodeId = findNodeIdByPath(document, "$.items[0].name");

  assert(itemsNodeId !== undefined, "array path should resolve to a structural node");
  assert(firstItemNodeId !== undefined, "nested object path should resolve to a structural node");
  assert(nameNodeId !== undefined, "nested string path should resolve to a structural node");
  assert(requireNode(document, itemsNodeId, "items node should exist").kind === "array", "items path should point to an array node");
  assert(requireNode(document, firstItemNodeId, "first item node should exist").kind === "object", "array item should be an object node");
  assert(requireNode(document, nameNodeId, "name node should exist").kind === "string", "nested value should be a string node");
  assert(requireNode(document, firstItemNodeId, "first item node should exist").parentId !== undefined, "nested object should track its structural parent");
}

function invalidJsonProducesDeterministicDiagnostic(): void {
  const result = parseJsonDocument('{"items": ]');
  assert(result.document === undefined, "invalid JSON should not produce a structural index");
  assert(result.diagnostics.length === 1, "invalid JSON should produce one diagnostic");
  const diagnostic = result.diagnostics[0];
  if (diagnostic === undefined) {
    throw new Error("diagnostic should exist");
  }

  assert(diagnostic.message === "Expected a JSON value.", "diagnostic message should be deterministic");
  assert(diagnostic.severity === "error", "diagnostic severity should be error");
}

function foldStateCanBeToggledForObjectAndArrayNodes(): void {
  const result = parseJsonDocument('{"items":[{"name":"alpha"}]}');
  assert(result.document !== undefined, "document should parse before fold toggles");

  const document = requireDocument(result.document);
  const rootObjectId = document.rootNodeId;
  const arrayNodeId = findNodeIdByPath(document, "$.items");
  assert(arrayNodeId !== undefined, "array node should be discoverable by path");
  const resolvedArrayNodeId = arrayNodeId ?? "";

  const rootFolded = toggleFoldInDocument(document, rootObjectId);
  const arrayFolded = toggleFoldInDocument(rootFolded, resolvedArrayNodeId);

  assert(requireNode(rootFolded, rootObjectId, "root object should exist").folded, "root object fold state should toggle on");
  assert(requireNode(arrayFolded, resolvedArrayNodeId, "array node should exist").folded, "array fold state should toggle on");
}

function revealPathExpandsFoldedAncestors(): void {
  const registry = new SessionRegistry();
  registry.createSession({ hostElementId: "host-1", sessionId: "session-1" });
  registry.mountSession("session-1");
  registry.loadTextDocument({
    contentType: "application/json",
    documentId: "document-1",
    sessionId: "session-1",
    text: '{"items":[{"name":"alpha"}]}'
  });

  const initialSession = requireSession(registry.getSession("session-1"));
  const initialDocument = requireDocument(initialSession.document);

  const rootObjectId = initialDocument.rootNodeId;
  const arrayNodeId = findNodeIdByPath(initialDocument, "$.items");
  assert(arrayNodeId !== undefined, "array node should be discoverable before folding");
  const resolvedArrayNodeId = arrayNodeId ?? "";

  registry.toggleFold({ nodeId: rootObjectId, sessionId: "session-1" });
  registry.toggleFold({ nodeId: resolvedArrayNodeId, sessionId: "session-1" });
  const foldedSession = requireSession(registry.getSession("session-1"));
  const foldedDocument = requireDocument(foldedSession.document);
  assert(requireNode(foldedDocument, rootObjectId, "root object should exist").folded === true, "root object should be folded before reveal");
  assert(requireNode(foldedDocument, resolvedArrayNodeId, "array node should exist").folded === true, "array should be folded before reveal");

  registry.revealPath({ path: "$.items[0].name", sessionId: "session-1" });
  const revealedSession = requireSession(registry.getSession("session-1"));
  const revealedDocument = requireDocument(revealedSession.document);
  assert(requireNode(revealedDocument, rootObjectId, "root object should exist").folded === false, "root object should be expanded by revealPath");
  assert(requireNode(revealedDocument, resolvedArrayNodeId, "array node should exist").folded === false, "array should be expanded by revealPath");
  assert(revealedSession.revealTargetNodeId === findNodeIdByPath(revealedDocument, "$.items[0].name"), "revealPath should record the target node");
}

function sessionRegistryTracksCreateAndDispose(): void {
  const registry = new SessionRegistry();
  const session = registry.createSession({
    hostElementId: "host-1",
    options: {
      placeholderText: "Placeholder runtime"
    },
    sessionId: "session-1"
  });

  assert(session.lifecycleState === "created", "session should start in the created state");
  assert(registry.listSessionIds().length === 1, "registry should contain a created session");

  registry.mountSession("session-1");
  registry.loadTextDocument({
    contentType: "application/json",
    documentId: "document-1",
    sessionId: "session-1",
    text: '{"hello":"world"}'
  });
  registry.disposeSession({ sessionId: "session-1" });

  assert(registry.getSession("session-1") === undefined, "disposed sessions should be removed from the registry");
  assertThrows(
    () => registry.setViewport({ height: 100, sessionId: "session-1", width: 120 }),
    "disposed sessions should reject further commands"
  );
}

function runtimeProtocolVersionIsExported(): void {
  assert(RUNTIME_PROTOCOL_VERSION.length > 0, "protocol version should be a non-empty string");
}

parserBuildsStructuralIndexForObjectDocument();
parserBuildsStructuralIndexForArrayDocument();
parserBuildsStructuralIndexForNestedDocument();
invalidJsonProducesDeterministicDiagnostic();
foldStateCanBeToggledForObjectAndArrayNodes();
revealPathExpandsFoldedAncestors();
sessionRegistryTracksCreateAndDispose();
runtimeProtocolVersionIsExported();
