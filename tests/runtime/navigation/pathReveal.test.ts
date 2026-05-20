import { createDocumentSession } from "../../../src/runtime/runtime-core/src/document/documentSession.js";
import { resolveJsonPointerPath, revealPath } from "../../../src/runtime/runtime-core/src/navigation/pathReveal.js";
import { parseJsonPointer, decodeJsonPointerSegment } from "../../../src/runtime/runtime-core/src/navigation/jsonPath.js";
import type { ViewportState } from "../../../src/runtime/runtime-core/src/viewport/viewportTypes.js";
import { toggleFold } from "../../../src/runtime/runtime-core/src/viewport/viewportModel.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// decodeJsonPointerSegment
{
  assert(decodeJsonPointerSegment("foo") === "foo", "plain segment unchanged");
  assert(decodeJsonPointerSegment("a~1b") === "a/b", "~1 decodes to /");
  assert(decodeJsonPointerSegment("a~0b") === "a~b", "~0 decodes to ~");
  assert(decodeJsonPointerSegment("~01") === "~1", "~01 decodes to ~1 (order matters)");
}

// parseJsonPointer
{
  const r1 = parseJsonPointer("");
  assert(r1.success === true && r1.segments.length === 0, "empty pointer");

  const r2 = parseJsonPointer("/");
  assert(r2.success === true && r2.segments.length === 0, "root pointer");

  const r3 = parseJsonPointer("/foo/bar");
  assert(r3.success === true, "parse success");
  assert(r3.segments[0] === "foo" && r3.segments[1] === "bar", "segments");

  const r4 = parseJsonPointer("/a/1");
  assert(r4.segments[1] === 1, "numeric segment is number");

  const r5 = parseJsonPointer("noSlash");
  assert(r5.success === false, "non-/ path is invalid");
}

// resolveJsonPointerPath: root
{
  const session = createDocumentSession("p1", '{"a":1}');
  const result = resolveJsonPointerPath(session, "");
  assert(result.success === true, "empty path succeeds");
  assert(result.nodeId === session.rootNodeId, "resolves to root");
}

// resolveJsonPointerPath: property
{
  const session = createDocumentSession("p2", '{"name":"alice"}');
  const result = resolveJsonPointerPath(session, "/name");
  assert(result.success === true, "resolve property");
  const node = session.structuralIndex.nodesById[result.nodeId ?? ""];
  assert(node?.kind === "property" && node.propertyName === "name", "resolved to property node");
}

// resolveJsonPointerPath: array index
{
  const session = createDocumentSession("p3", '[10,20,30]');
  const result = resolveJsonPointerPath(session, "/1");
  assert(result.success === true, "resolve array index");
  const node = session.structuralIndex.nodesById[result.nodeId ?? ""];
  const src = session.sourceText.slice(node?.startOffset, node?.endOffset);
  assert(src === "20", "resolved to correct array element");
}

// resolveJsonPointerPath: not found
{
  const session = createDocumentSession("p4", '{"a":1}');
  const result = resolveJsonPointerPath(session, "/missing");
  assert(result.success === false && result.reason === "notFound", "not found");
}

// resolveJsonPointerPath: invalid path
{
  const session = createDocumentSession("p5", '{"a":1}');
  const result = resolveJsonPointerPath(session, "noSlash");
  assert(result.success === false && result.reason === "invalidPath", "invalid path");
}

// revealPath: unfolds ancestor
{
  const src = '{"a":{"b":42}}';
  let session = createDocumentSession("p6", src);

  // Find the outer object and fold it
  const { nodesById, nodeOrder } = session.structuralIndex;
  const outerObjId = nodeOrder.find(id => nodesById[id]?.kind === "object");
  assert(outerObjId !== undefined, "outer object found");
  session = toggleFold(session, outerObjId!);

  const viewport: ViewportState = { sessionId: "p6", firstVisibleRow: 0, visibleRowCount: 20 };
  const result = revealPath(session, viewport, "/a/b");

  assert(result.pathResult.success === true, "reveal succeeds");
  assert(!result.session.structuralIndex.foldedNodeIds.has(outerObjId!), "outer object unfolded");
  assert(result.viewport.focusedNodeId !== undefined, "focused node set");
}

console.log("pathReveal tests passed");
