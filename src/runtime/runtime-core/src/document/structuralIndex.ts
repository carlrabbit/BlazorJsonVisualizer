import type { NodeId } from "./nodeIds.js";
import type { JsonNode } from "./jsonNode.js";
import type { JsonToken } from "../json/tokens.js";

export interface StructuralIndex {
  rootNodeId: NodeId;
  nodesById: Record<NodeId, JsonNode>;
  nodeOrder: NodeId[];
  foldedNodeIds: Set<NodeId>;
}

export function isFoldable(node: JsonNode): boolean {
  return node.kind === "object" || node.kind === "array";
}

export function listChildNodeIds(index: StructuralIndex, nodeId: NodeId): NodeId[] {
  const node = index.nodesById[nodeId];
  if (node === undefined || node.firstChildId === undefined) return [];

  const children: NodeId[] = [];
  let currentId: NodeId | undefined = node.firstChildId;

  while (currentId !== undefined) {
    children.push(currentId);
    currentId = index.nodesById[currentId]?.nextSiblingId;
  }

  return children;
}

interface BuildFrame {
  nodeId: NodeId;
  kind: "document" | "object" | "array";
  depth: number;
  expectingPropertyKey: boolean;
  pendingPropertyId: NodeId | undefined;
  lastChildId: NodeId | undefined;
  lastPropertyChildId: NodeId | undefined;
}

function decodeStringContent(raw: string): string {
  const inner = raw.slice(1, -1);
  let result = "";
  let i = 0;

  while (i < inner.length) {
    const c = inner[i] as string;
    if (c === "\\" && i + 1 < inner.length) {
      const next = inner[i + 1] as string;
      switch (next) {
        case "\"": result += "\""; break;
        case "\\": result += "\\"; break;
        case "/": result += "/"; break;
        case "b": result += "\b"; break;
        case "f": result += "\f"; break;
        case "n": result += "\n"; break;
        case "r": result += "\r"; break;
        case "t": result += "\t"; break;
        case "u": {
          const hex = inner.slice(i + 2, i + 6);
          result += String.fromCharCode(parseInt(hex, 16));
          i += 4;
          break;
        }
        default: result += next;
      }
      i += 2;
    } else {
      result += c;
      i++;
    }
  }

  return result;
}

export function buildStructuralIndex(tokens: JsonToken[], sourceText: string): StructuralIndex {
  const nodesById: Record<NodeId, JsonNode> = {};
  const nodeOrder: NodeId[] = [];
  let nodeCounter = 0;

  function allocateId(): NodeId {
    return `n${++nodeCounter}`;
  }

  function addNode(node: JsonNode): void {
    nodesById[node.id] = node;
    nodeOrder.push(node.id);
  }

  function updateNode(id: NodeId, updates: Partial<JsonNode>): void {
    const node = nodesById[id];
    if (node !== undefined) {
      Object.assign(node, updates);
    }
  }

  // Link childId as the next child after lastChildId under parentId
  function linkChild(parentId: NodeId, childId: NodeId, lastChildId: NodeId | undefined): void {
    if (lastChildId !== undefined) {
      updateNode(lastChildId, { nextSiblingId: childId });
    } else {
      updateNode(parentId, { firstChildId: childId });
    }
    updateNode(childId, { parentId });
  }

  const documentId = allocateId();
  addNode({
    id: documentId,
    kind: "document",
    startOffset: 0,
    endOffset: sourceText.length,
    depth: 0,
  });

  const stack: BuildFrame[] = [{
    nodeId: documentId,
    kind: "document",
    depth: 0,
    expectingPropertyKey: false,
    pendingPropertyId: undefined,
    lastChildId: undefined,
    lastPropertyChildId: undefined,
  }];

  // Add a value node to the current stack frame context.
  // isPrimitive=true means the value is complete; finalize any pending property immediately.
  function addValueToFrame(frame: BuildFrame, childId: NodeId, isPrimitive: boolean): void {
    if (frame.kind === "object" && frame.pendingPropertyId !== undefined) {
      linkChild(frame.pendingPropertyId, childId, frame.lastPropertyChildId);
      frame.lastPropertyChildId = childId;

      if (isPrimitive) {
        const childNode = nodesById[childId];
        if (childNode !== undefined) {
          updateNode(frame.pendingPropertyId, { endOffset: childNode.endOffset });
        }
        linkChild(frame.nodeId, frame.pendingPropertyId, frame.lastChildId);
        frame.lastChildId = frame.pendingPropertyId;
        frame.pendingPropertyId = undefined;
        frame.lastPropertyChildId = undefined;
        frame.expectingPropertyKey = true;
      }
    } else {
      linkChild(frame.nodeId, childId, frame.lastChildId);
      frame.lastChildId = childId;
    }
  }

  function valueDepthForFrame(frame: BuildFrame): number {
    if (frame.kind === "object" && frame.pendingPropertyId !== undefined) {
      return nodesById[frame.pendingPropertyId]?.depth ?? frame.depth + 1;
    }
    return frame.depth + 1;
  }

  function finalizeContainerInParent(endOffset: number): void {
    const parentFrame = stack[stack.length - 1];
    if (
      parentFrame !== undefined &&
      parentFrame.kind === "object" &&
      parentFrame.pendingPropertyId !== undefined
    ) {
      updateNode(parentFrame.pendingPropertyId, { endOffset });
      linkChild(parentFrame.nodeId, parentFrame.pendingPropertyId, parentFrame.lastChildId);
      parentFrame.lastChildId = parentFrame.pendingPropertyId;
      parentFrame.pendingPropertyId = undefined;
      parentFrame.lastPropertyChildId = undefined;
      parentFrame.expectingPropertyKey = true;
    }
  }

  const nonWhitespace = tokens.filter(t => t.kind !== "whitespace");

  for (const token of nonWhitespace) {
    const frame = stack[stack.length - 1];
    if (frame === undefined) break;

    switch (token.kind) {
      case "braceOpen": {
        const id = allocateId();
        const depth = valueDepthForFrame(frame);
        addNode({ id, kind: "object", startOffset: token.startOffset, endOffset: token.endOffset, depth });
        addValueToFrame(frame, id, false);
        stack.push({
          nodeId: id,
          kind: "object",
          depth,
          expectingPropertyKey: true,
          pendingPropertyId: undefined,
          lastChildId: undefined,
          lastPropertyChildId: undefined,
        });
        break;
      }

      case "braceClose": {
        const closed = stack.pop();
        if (closed === undefined || closed.kind !== "object") {
          if (closed !== undefined) stack.push(closed);
          break;
        }
        if (closed.pendingPropertyId !== undefined) {
          linkChild(closed.nodeId, closed.pendingPropertyId, closed.lastChildId);
        }
        updateNode(closed.nodeId, { endOffset: token.endOffset });
        finalizeContainerInParent(token.endOffset);
        break;
      }

      case "bracketOpen": {
        const id = allocateId();
        const depth = valueDepthForFrame(frame);
        addNode({ id, kind: "array", startOffset: token.startOffset, endOffset: token.endOffset, depth });
        addValueToFrame(frame, id, false);
        stack.push({
          nodeId: id,
          kind: "array",
          depth,
          expectingPropertyKey: false,
          pendingPropertyId: undefined,
          lastChildId: undefined,
          lastPropertyChildId: undefined,
        });
        break;
      }

      case "bracketClose": {
        const closed = stack.pop();
        if (closed === undefined || closed.kind !== "array") {
          if (closed !== undefined) stack.push(closed);
          break;
        }
        updateNode(closed.nodeId, { endOffset: token.endOffset });
        finalizeContainerInParent(token.endOffset);
        break;
      }

      case "string": {
        if (frame.kind === "object" && frame.expectingPropertyKey) {
          const id = allocateId();
          const depth = frame.depth + 1;
          const raw = sourceText.slice(token.startOffset, token.endOffset);
          const propName = decodeStringContent(raw);
          addNode({ id, kind: "property", startOffset: token.startOffset, endOffset: token.endOffset, depth, propertyName: propName });
          frame.pendingPropertyId = id;
          frame.lastPropertyChildId = undefined;
          frame.expectingPropertyKey = false;
        } else {
          const id = allocateId();
          const depth = valueDepthForFrame(frame);
          addNode({ id, kind: "string", startOffset: token.startOffset, endOffset: token.endOffset, depth });
          addValueToFrame(frame, id, true);
        }
        break;
      }

      case "number": {
        const id = allocateId();
        const depth = valueDepthForFrame(frame);
        addNode({ id, kind: "number", startOffset: token.startOffset, endOffset: token.endOffset, depth });
        addValueToFrame(frame, id, true);
        break;
      }

      case "true":
      case "false": {
        const id = allocateId();
        const depth = valueDepthForFrame(frame);
        addNode({ id, kind: "boolean", startOffset: token.startOffset, endOffset: token.endOffset, depth });
        addValueToFrame(frame, id, true);
        break;
      }

      case "null": {
        const id = allocateId();
        const depth = valueDepthForFrame(frame);
        addNode({ id, kind: "null", startOffset: token.startOffset, endOffset: token.endOffset, depth });
        addValueToFrame(frame, id, true);
        break;
      }

      case "invalid": {
        const id = allocateId();
        const depth = valueDepthForFrame(frame);
        addNode({ id, kind: "invalid", startOffset: token.startOffset, endOffset: token.endOffset, depth });
        addValueToFrame(frame, id, true);
        break;
      }

      case "colon":
      case "comma":
        break;
    }
  }

  return { rootNodeId: documentId, nodesById, nodeOrder, foldedNodeIds: new Set() };
}
