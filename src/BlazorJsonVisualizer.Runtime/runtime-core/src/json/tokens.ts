export type JsonTokenKind =
  | "braceOpen"
  | "braceClose"
  | "bracketOpen"
  | "bracketClose"
  | "colon"
  | "comma"
  | "string"
  | "number"
  | "true"
  | "false"
  | "null"
  | "whitespace"
  | "invalid";

export interface JsonToken {
  kind: JsonTokenKind;
  startOffset: number;
  endOffset: number;
}
