import type { DocumentSessionId, DocumentSession } from "../../../runtime-core/src/document/documentSession.js";
import { createDocumentSession, disposeDocumentSession } from "../../../runtime-core/src/document/documentSession.js";
import type { ViewportState } from "../../../runtime-core/src/viewport/viewportTypes.js";
import { getVisibleRows, toggleFold } from "../../../runtime-core/src/viewport/viewportModel.js";
import { revealPath } from "../../../runtime-core/src/navigation/pathReveal.js";
import type { RenderRow } from "../../../runtime-core/src/viewport/viewportTypes.js";

const sessions = new Map<DocumentSessionId, DocumentSession>();
const viewports = new Map<DocumentSessionId, ViewportState>();

export function layer1CreateSession(id: DocumentSessionId, sourceText: string): boolean {
  if (sessions.has(id)) return false;
  const session = createDocumentSession(id, sourceText);
  sessions.set(id, session);
  viewports.set(id, {
    sessionId: id,
    firstVisibleRow: 0,
    visibleRowCount: 50
  });
  return true;
}

export function layer1SetViewport(id: DocumentSessionId, firstVisibleRow: number, visibleRowCount: number): boolean {
  const session = sessions.get(id);
  if (session === undefined) return false;

  const prev = viewports.get(id);
  viewports.set(id, {
    sessionId: id,
    firstVisibleRow,
    visibleRowCount,
    ...(prev?.focusedNodeId !== undefined ? { focusedNodeId: prev.focusedNodeId } : {})
  });
  return true;
}

export function layer1ToggleFold(id: DocumentSessionId, nodeId: string): boolean {
  const session = sessions.get(id);
  if (session === undefined) return false;

  const updated = toggleFold(session, nodeId);
  sessions.set(id, updated);
  return true;
}

export function layer1RevealPath(id: DocumentSessionId, path: string): boolean {
  const session = sessions.get(id);
  const viewport = viewports.get(id);
  if (session === undefined || viewport === undefined) return false;

  const result = revealPath(session, viewport, path);
  sessions.set(id, result.session);
  viewports.set(id, result.viewport);
  return result.pathResult.success;
}

export function layer1Render(id: DocumentSessionId): RenderRow[] {
  const session = sessions.get(id);
  const viewport = viewports.get(id);
  if (session === undefined || viewport === undefined) return [];

  return getVisibleRows(session, viewport);
}

export function layer1DisposeSession(id: DocumentSessionId): void {
  const session = sessions.get(id);
  if (session !== undefined) {
    disposeDocumentSession(session);
    sessions.delete(id);
    viewports.delete(id);
  }
}
