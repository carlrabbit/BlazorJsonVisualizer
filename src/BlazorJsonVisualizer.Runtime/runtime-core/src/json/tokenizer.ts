import type { JsonToken } from "./tokens.js";

export function tokenize(text: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let pos = 0;

  while (pos < text.length) {
    const ch = text[pos] as string;

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      const start = pos;
      while (pos < text.length) {
        const c = text[pos];
        if (c !== " " && c !== "\t" && c !== "\r" && c !== "\n") break;
        pos++;
      }
      tokens.push({ kind: "whitespace", startOffset: start, endOffset: pos });
      continue;
    }

    // Single-character structural tokens
    if (ch === "{") {
      tokens.push({ kind: "braceOpen", startOffset: pos, endOffset: pos + 1 });
      pos++;
      continue;
    }
    if (ch === "}") {
      tokens.push({ kind: "braceClose", startOffset: pos, endOffset: pos + 1 });
      pos++;
      continue;
    }
    if (ch === "[") {
      tokens.push({ kind: "bracketOpen", startOffset: pos, endOffset: pos + 1 });
      pos++;
      continue;
    }
    if (ch === "]") {
      tokens.push({ kind: "bracketClose", startOffset: pos, endOffset: pos + 1 });
      pos++;
      continue;
    }
    if (ch === ":") {
      tokens.push({ kind: "colon", startOffset: pos, endOffset: pos + 1 });
      pos++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "comma", startOffset: pos, endOffset: pos + 1 });
      pos++;
      continue;
    }

    // String
    if (ch === '"') {
      const start = pos;
      pos++; // consume opening quote
      let terminated = false;

      while (pos < text.length) {
        const c = text[pos] as string;
        if (c === "\\") {
          pos += 2; // skip escape (may overshoot at end of string, harmless)
          continue;
        }
        if (c === '"') {
          pos++; // consume closing quote
          terminated = true;
          break;
        }
        pos++;
      }

      tokens.push({ kind: terminated ? "string" : "invalid", startOffset: start, endOffset: pos });
      continue;
    }

    // Number: optional minus, integer, optional fraction, optional exponent
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = pos;
      if (text[pos] === "-") pos++;

      if (pos < text.length && text[pos] === "0") {
        pos++;
      } else {
        while (pos < text.length && (text[pos] as string) >= "0" && (text[pos] as string) <= "9") pos++;
      }

      if (pos < text.length && text[pos] === ".") {
        pos++;
        while (pos < text.length && (text[pos] as string) >= "0" && (text[pos] as string) <= "9") pos++;
      }

      if (pos < text.length && (text[pos] === "e" || text[pos] === "E")) {
        pos++;
        if (pos < text.length && (text[pos] === "+" || text[pos] === "-")) pos++;
        while (pos < text.length && (text[pos] as string) >= "0" && (text[pos] as string) <= "9") pos++;
      }

      tokens.push({ kind: "number", startOffset: start, endOffset: pos });
      continue;
    }

    // Keyword literals
    if (text.startsWith("true", pos)) {
      tokens.push({ kind: "true", startOffset: pos, endOffset: pos + 4 });
      pos += 4;
      continue;
    }
    if (text.startsWith("false", pos)) {
      tokens.push({ kind: "false", startOffset: pos, endOffset: pos + 5 });
      pos += 5;
      continue;
    }
    if (text.startsWith("null", pos)) {
      tokens.push({ kind: "null", startOffset: pos, endOffset: pos + 4 });
      pos += 4;
      continue;
    }

    // Unrecognized character
    tokens.push({ kind: "invalid", startOffset: pos, endOffset: pos + 1 });
    pos++;
  }

  return tokens;
}
