import type { NodeId } from "../document/nodeIds.js";
import type { DocumentSession } from "../document/documentSession.js";
import type { ViewportState } from "../viewport/viewportTypes.js";
import { parseJsonPointer } from "./jsonPath.js";
import { computeRenderRows, toggleFold } from "../viewport/viewportModel.js";
import { listChildNodeIds, isFoldable } from "../document/structuralIndex.js";

export interface PathRevealResult {
  success: boolean;
  nodeId?: NodeId;
  reason?: "notFound" | "invalidPath" | "notIndexed";
}

export interface RevealResult {
  session: DocumentSession;
  viewport: ViewportState;
  pathResult: PathRevealResult;
}

export function resolveJsonPointerPath(session: DocumentSession, path: string): PathRevealResult {
  const { structuralIndex } = session;
  const { rootNodeId, nodesById } = structuralIndex;

  if (path === "" || path === "/") {
    return { success: true, nodeId: rootNodeId };
  }

  const parsed = parseJsonPointer(path);
  if (!parsed.success) {
    return { success: false, reason: "invalidPath" };
  }

  // Start traversal from the root JSON value (document's first child)
  const documentNode = nodesById[rootNodeId];
  let currentValueId: NodeId | undefined = documentNode?.firstChildId;

  if (currentValueId === undefined) {
    return { success: false, reason: "notFound" };
  }

  let resolvedId: NodeId = currentValueId;

  for (const segment of parsed.segments) {
    const currentNode = nodesById[currentValueId];
    if (currentNode === undefined) return { success: false, reason: "notFound" };

    if (typeof segment === "string") {
      if (currentNode.kind !== "object") return { success: false, reason: "notFound" };

      const children = listChildNodeIds(structuralIndex, currentValueId);
      let foundPropId: NodeId | undefined;

      for (const childId of children) {
        const child = nodesById[childId];
        if (child?.kind === "property" && child.propertyName === segment) {
          foundPropId = childId;
          break;
        }
      }

      if (foundPropId === undefined) return { success: false, reason: "notFound" };

      resolvedId = foundPropId;
      // Move into the property's value for subsequent segments
      currentValueId = nodesById[foundPropId]?.firstChildId ?? foundPropId;
    } else {
      if (currentNode.kind !== "array") return { success: false, reason: "notFound" };

      const children = listChildNodeIds(structuralIndex, currentValueId);
      const index = segment as number;

      if (index < 0 || index >= children.length) return { success: false, reason: "notFound" };

      const childId = children[index];
      if (childId === undefined) return { success: false, reason: "notFound" };

      resolvedId = childId;
      currentValueId = childId;
    }
  }

  return { success: true, nodeId: resolvedId };
}

export function revealPath(session: DocumentSession, viewport: ViewportState, path: string): RevealResult {
  const pathResult = resolveJsonPointerPath(session, path);

  if (!pathResult.success || pathResult.nodeId === undefined) {
    return { session, viewport, pathResult };
  }

  const targetNodeId = pathResult.nodeId;
  let updatedSession = session;

  // Expand all folded ancestors of the target node
  const { nodesById } = session.structuralIndex;
  let current = nodesById[targetNodeId];

  while (current?.parentId !== undefined) {
    const parentId = current.parentId;
    const parent = nodesById[parentId];
    if (parent !== undefined && isFoldable(parent) && updatedSession.structuralIndex.foldedNodeIds.has(parentId)) {
      updatedSession = toggleFold(updatedSession, parentId);
    }
    current = parent;
  }

  // Locate the row for the target node
  const rows = computeRenderRows(updatedSession);
  const targetRowIndex = rows.findIndex((r) => r.nodeId === targetNodeId);

  let updatedViewport: ViewportState;

  if (targetRowIndex >= 0) {
    const centeredFirst = Math.max(0, targetRowIndex - Math.floor(viewport.visibleRowCount / 2));
    updatedViewport = { ...viewport, firstVisibleRow: centeredFirst, focusedNodeId: targetNodeId };
  } else {
    updatedViewport = { ...viewport, focusedNodeId: targetNodeId };
  }

  return { session: updatedSession, viewport: updatedViewport, pathResult };
}
