import type { NodeId } from "./nodeIds.js";
import type { StructuralIndex } from "./structuralIndex.js";
import { buildStructuralIndex } from "./structuralIndex.js";
import { tokenize } from "../json/tokenizer.js";
import type { JsonToken } from "../json/tokens.js";

export type DocumentSessionId = string;
export type RevisionId = number;
export type DocumentSessionMode = "readOnly" | "editable";

export interface DocumentSession {
  id: DocumentSessionId;
  revision: RevisionId;
  mode: DocumentSessionMode;
  sourceText: string;
  tokenCount: number;
  rootNodeId: NodeId;
  structuralIndex: StructuralIndex;
  tokens: JsonToken[];
}

export function createDocumentSession(
  id: DocumentSessionId,
  sourceText: string,
  mode: DocumentSessionMode = "readOnly"
): DocumentSession {
  const tokens = tokenize(sourceText);
  const structuralIndex = buildStructuralIndex(tokens, sourceText);

  return {
    id,
    revision: 1,
    mode,
    sourceText,
    tokenCount: tokens.length,
    rootNodeId: structuralIndex.rootNodeId,
    structuralIndex,
    tokens,
  };
}

export function disposeDocumentSession(_session: DocumentSession): void {
  // No active resources to release in this read-only implementation.
}
