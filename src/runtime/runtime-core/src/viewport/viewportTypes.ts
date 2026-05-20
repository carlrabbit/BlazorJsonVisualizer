import type { NodeId } from "../document/nodeIds.js";
import type { DocumentSessionId } from "../document/documentSession.js";

export interface ViewportState {
  sessionId: DocumentSessionId;
  firstVisibleRow: number;
  visibleRowCount: number;
  focusedNodeId?: NodeId;
}

export type RenderRowKind = "node" | "foldPlaceholder" | "diagnostic";

export interface RenderRow {
  rowIndex: number;
  kind: RenderRowKind;
  nodeId?: NodeId;
  depth: number;
  text: string;
  folded?: boolean;
}
