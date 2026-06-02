import { tokenize } from "../../../src/BlazorJsonVisualizer.Runtime/runtime-core/src/json/tokenizer.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// Empty string
{
  const tokens = tokenize("");
  assert(tokens.length === 0, "empty string should produce no tokens");
}

// Whitespace only
{
  const tokens = tokenize("   \n\t");
  assert(tokens.length === 1, "whitespace-only should produce 1 token");
  assert(tokens[0]?.kind === "whitespace", "should be whitespace token");
}

// Structural chars
{
  const tokens = tokenize("{}[]:,");
  const kinds = tokens.map((t: { kind: string }) => t.kind);
  assert(kinds.join(",") === "braceOpen,braceClose,bracketOpen,bracketClose,colon,comma", "structural chars");
}

// Simple string
{
  const tokens = tokenize('"hello"');
  assert(tokens.length === 1, "single string");
  assert(tokens[0]?.kind === "string", "kind should be string");
  assert(tokens[0]?.startOffset === 0 && tokens[0]?.endOffset === 7, "string offsets");
}

// Number
{
  const tokens = tokenize("42.5e2");
  assert(tokens.length === 1, "number token");
  assert(tokens[0]?.kind === "number", "should be number");
}

// Negative number
{
  const tokens = tokenize("-1");
  assert(tokens[0]?.kind === "number", "negative number");
}

// Boolean and null
{
  const tokens = tokenize("true false null");
  const kinds = tokens.filter((t: { kind: string }) => t.kind !== "whitespace").map((t: { kind: string }) => t.kind);
  assert(kinds.join(",") === "true,false,null", "booleans and null");
}

// String with escape
{
  const tokens = tokenize('"a\\nb"');
  assert(tokens[0]?.kind === "string", "escaped string");
  assert(tokens[0]?.endOffset === 6, "escaped string span");
}

// Unterminated string (invalid)
{
  const tokens = tokenize('"unterminated');
  assert(tokens[0]?.kind === "invalid", "unterminated string should be invalid");
}

// Invalid character
{
  const tokens = tokenize("@");
  assert(tokens[0]?.kind === "invalid", "@ should be invalid");
}

// Full JSON object
{
  const src = '{"key": 1, "flag": true}';
  const tokens = tokenize(src);
  const nonWs = tokens.filter((t: { kind: string }) => t.kind !== "whitespace");
  // braceOpen, string(key), colon, number, comma, string(flag), colon, true, braceClose
  assert(nonWs.length === 9, `expected 9 non-ws tokens, got ${nonWs.length}`);
}

console.log("tokenizer tests passed");
