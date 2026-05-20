# JSON Tokenizer Specification

## Goal

Define the Layer 1 JSON tokenizer used by the TypeScript runtime core.

The tokenizer converts JSON source text into deterministic token ranges without constructing a JavaScript object tree.

## Authority

This document is authoritative for:

- JSON token categories
- token range semantics
- tokenizer failure reporting
- tokenizer output ordering
- tokenizer non-goals

This document is not authoritative for:

- structural indexing
- rendering
- validation
- editing
- schema semantics

## Inputs

The tokenizer accepts a UTF-16 JavaScript string containing JSON source text.

Offsets are UTF-16 code unit offsets because this is the native JavaScript string indexing model.

## Output Model

```ts
type JsonTokenKind =
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

interface JsonToken {
  kind: JsonTokenKind;
  startOffset: number;
  endOffset: number;
}
```

`startOffset` is inclusive. `endOffset` is exclusive.

Tokens must be emitted in source order and must not overlap.

## Token Rules

- Whitespace is emitted as `whitespace` tokens.
- Object delimiters are emitted as `braceOpen` and `braceClose`.
- Array delimiters are emitted as `bracketOpen` and `bracketClose`.
- `:` is emitted as `colon`.
- `,` is emitted as `comma`.
- String literals are emitted as `string` tokens.
- Number literals are emitted as `number` tokens.
- `true`, `false`, and `null` are emitted as their literal token kinds.
- Invalid or incomplete lexical regions are emitted as `invalid` tokens where practical.

## String Semantics

The tokenizer must recognize JSON string ranges, including escaped characters.

The tokenizer is not required to decode string values in this milestone.

## Number Semantics

The tokenizer must recognize JSON number ranges.

The tokenizer is not required to convert numbers to JavaScript numbers in this milestone.

## Failure Semantics

The tokenizer should prefer producing tokens with `invalid` ranges over throwing exceptions for malformed input.

Throwing is allowed only for programmer errors such as invalid API arguments.

## Non-Goals

The tokenizer does not:

- validate complete JSON structure
- build a parse tree
- build JavaScript objects
- decode all scalar values
- perform schema validation
- perform formatting
- perform editing

## Fast Tests

Fast tokenizer tests must use small deterministic JSON snippets.

Allowed tests:

- empty text
- whitespace-only text
- small object
- small array
- nested object/array
- strings with escapes
- numbers
- literals
- malformed string
- unexpected character

Disallowed by default:

- huge JSON files
- fuzzing
- benchmarks
- endurance tests
