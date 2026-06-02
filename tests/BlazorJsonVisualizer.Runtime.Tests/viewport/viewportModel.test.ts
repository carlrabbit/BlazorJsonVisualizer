import { createDocumentSession } from "../../../src/BlazorJsonVisualizer.Runtime/runtime-core/src/document/documentSession.js";
import {
  computeRenderRows,
  getVisibleRows,
  toggleFold
} from "../../../src/BlazorJsonVisualizer.Runtime/runtime-core/src/viewport/viewportModel.js";
import type { ViewportState } from "../../../src/BlazorJsonVisualizer.Runtime/runtime-core/src/viewport/viewportTypes.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// Simple primitive renders one row (document + value = 2 rows, but document row is included)
{
  const session = createDocumentSession("v1", "42");
  const rows = computeRenderRows(session);
  // document row + number row
  assert(rows.length === 2, `expected 2 rows for '42', got ${rows.length}`);
  assert(rows[0]?.nodeId !== undefined, "first row has nodeId");
}

// Object rows: document + object + properties (not their inline values)
{
  const session = createDocumentSession("v2", '{"a":1,"b":2}');
  const rows = computeRenderRows(session);
  // document, object-open, prop-a (inline "a": 1), prop-b (inline "b": 2)
  assert(rows.length === 4, `expected 4 rows, got ${rows.length}`);
  const propRow = rows.find((r) => r.text.includes('"a"'));
  assert(propRow !== undefined, "property row shows key");
  assert(propRow?.text.includes("1") === true, "property row shows value");
}

// Array: document + array + items
{
  const session = createDocumentSession("v3", "[1,2,3]");
  const rows = computeRenderRows(session);
  assert(rows.length === 5, `expected 5 rows, got ${rows.length}`);
}

// toggleFold hides children
{
  const session = createDocumentSession("v4", '{"a":1,"b":2}');
  const allRows = computeRenderRows(session);
  const objRow = allRows.find((r) => {
    const n = session.structuralIndex.nodesById[r.nodeId ?? ""];
    return n?.kind === "object";
  });
  assert(objRow !== undefined, "should have object row");

  const folded = toggleFold(session, objRow!.nodeId!);
  const foldedRows = computeRenderRows(folded);
  // document + folded-object (props hidden)
  assert(foldedRows.length === 2, `expected 2 rows after fold, got ${foldedRows.length}`);
  const foldedObjRow = foldedRows.find((r) => r.nodeId === objRow!.nodeId);
  assert(foldedObjRow?.folded === true, "folded row has folded=true");
  assert(foldedObjRow?.text === "{ ... }", "folded text");
}

// toggleFold twice = unfolded
{
  const session = createDocumentSession("v5", "[1,2]");
  const rows = computeRenderRows(session);
  const arrRow = rows.find((r) => session.structuralIndex.nodesById[r.nodeId ?? ""]?.kind === "array");
  assert(arrRow !== undefined, "array row found");

  const folded = toggleFold(session, arrRow!.nodeId!);
  const unfolded = toggleFold(folded, arrRow!.nodeId!);
  const unfoldedRows = computeRenderRows(unfolded);
  assert(unfoldedRows.length === rows.length, "toggle twice restores original row count");
}

// getVisibleRows respects viewport
{
  const session = createDocumentSession("v6", "[1,2,3]");
  const viewport: ViewportState = { sessionId: "v6", firstVisibleRow: 1, visibleRowCount: 2 };
  const visible = getVisibleRows(session, viewport);
  assert(visible.length === 2, "visible rows length matches visibleRowCount");
  assert(visible[0]?.rowIndex === 1, "first visible row has correct rowIndex");
}

// getVisibleRows at end of list
{
  const session = createDocumentSession("v7", "null");
  const viewport: ViewportState = { sessionId: "v7", firstVisibleRow: 100, visibleRowCount: 10 };
  const visible = getVisibleRows(session, viewport);
  assert(visible.length === 0, "past end returns empty");
}

console.log("viewportModel tests passed");
