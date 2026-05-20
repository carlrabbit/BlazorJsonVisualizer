import type { NodeId } from "../../../runtime-core/src/document/nodeIds.js";
import type { DocumentSession } from "../../../runtime-core/src/document/documentSession.js";
import type { ViewportState } from "../../../runtime-core/src/viewport/viewportTypes.js";
import { getVisibleRows, toggleFold } from "../../../runtime-core/src/viewport/viewportModel.js";
import { renderRows } from "./jsonViewRenderer.js";

export interface FoldingController {
  renderViewport(session: DocumentSession, viewport: ViewportState): void;
  handleToggleFold(
    session: DocumentSession,
    viewport: ViewportState,
    nodeId: NodeId
  ): DocumentSession;
}

export function createFoldingController(containerElement: Element): FoldingController {
  return {
    renderViewport(session: DocumentSession, viewport: ViewportState): void {
      const rows = getVisibleRows(session, viewport);
      renderRows(rows, { containerElement });
    },

    handleToggleFold(
      session: DocumentSession,
      viewport: ViewportState,
      nodeId: NodeId
    ): DocumentSession {
      const updated = toggleFold(session, nodeId);
      const rows = getVisibleRows(updated, viewport);
      renderRows(rows, { containerElement });
      return updated;
    },
  };
}
