import type { NodeId } from "./nodeIds.js";

export type JsonNodeKind =
  | "document"
  | "object"
  | "array"
  | "property"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "invalid";

export interface JsonNode {
  id: NodeId;
  kind: JsonNodeKind;
  startOffset: number;
  endOffset: number;
  parentId?: NodeId;
  depth: number;
  firstChildId?: NodeId;
  nextSiblingId?: NodeId;
  propertyName?: string;
}
