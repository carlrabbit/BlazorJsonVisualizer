import type { NodeId } from "../document/nodeIds.js";
import type { JsonNode } from "../document/jsonNode.js";
import type { StructuralIndex } from "../document/structuralIndex.js";
import { isFoldable } from "../document/structuralIndex.js";
import type { DocumentSession } from "../document/documentSession.js";
import type { ViewportState, RenderRow } from "./viewportTypes.js";

function getValuePreview(node: JsonNode, foldedNodeIds: Set<NodeId>, sourceText: string): string {
  switch (node.kind) {
    case "object":
      return foldedNodeIds.has(node.id) ? "{ ... }" : "{";
    case "array":
      return foldedNodeIds.has(node.id) ? "[ ... ]" : "[";
    default:
      return sourceText.slice(node.startOffset, node.endOffset);
  }
}

function generateRowText(
  node: JsonNode,
  nodesById: StructuralIndex["nodesById"],
  foldedNodeIds: Set<NodeId>,
  sourceText: string
): string {
  switch (node.kind) {
    case "document": {
      // Show first non-whitespace token text as a preview, or empty
      const raw = sourceText.trimStart();
      return raw.length > 0 ? (raw[0] as string) : "";
    }

    case "object":
      return foldedNodeIds.has(node.id) ? "{ ... }" : "{";

    case "array":
      return foldedNodeIds.has(node.id) ? "[ ... ]" : "[";

    case "property": {
      const name = node.propertyName ?? "";
      const child = node.firstChildId !== undefined ? nodesById[node.firstChildId] : undefined;
      if (child === undefined) return `"${name}":`;
      return `"${name}": ${getValuePreview(child, foldedNodeIds, sourceText)}`;
    }

    default:
      return sourceText.slice(node.startOffset, node.endOffset);
  }
}

export function computeRenderRows(session: DocumentSession): RenderRow[] {
  const { structuralIndex, sourceText } = session;
  const { nodesById, nodeOrder, foldedNodeIds } = structuralIndex;

  const rows: RenderRow[] = [];
  let rowIndex = 0;
  let skipFromDepth: number | undefined = undefined;

  for (const nodeId of nodeOrder) {
    const node = nodesById[nodeId];
    if (node === undefined) continue;

    // Skip descendants of a folded container
    if (skipFromDepth !== undefined) {
      if (node.depth > skipFromDepth) continue;
      else skipFromDepth = undefined;
    }

    // Nodes whose parent is a property are rendered inline with the property row
    const parentKind = node.parentId !== undefined ? nodesById[node.parentId]?.kind : undefined;
    const isChildOfProperty = parentKind === "property";

    const folded = isFoldable(node) && foldedNodeIds.has(nodeId);

    // When a foldable node (even if skipped as its own row) is folded, suppress its descendants
    if (folded) {
      skipFromDepth = node.depth;
    }

    if (!isChildOfProperty) {
      rows.push({
        rowIndex: rowIndex++,
        kind: "node",
        nodeId,
        depth: node.depth,
        text: generateRowText(node, nodesById, foldedNodeIds, sourceText),
        folded
      });
    }
  }

  return rows;
}

export function getVisibleRows(session: DocumentSession, viewport: ViewportState): RenderRow[] {
  const all = computeRenderRows(session);
  return all.slice(viewport.firstVisibleRow, viewport.firstVisibleRow + viewport.visibleRowCount);
}

export function toggleFold(session: DocumentSession, nodeId: NodeId): DocumentSession {
  const prev = session.structuralIndex.foldedNodeIds;
  const next = new Set(prev);

  if (next.has(nodeId)) {
    next.delete(nodeId);
  } else {
    next.add(nodeId);
  }

  return {
    ...session,
    structuralIndex: {
      ...session.structuralIndex,
      foldedNodeIds: next
    }
  };
}
