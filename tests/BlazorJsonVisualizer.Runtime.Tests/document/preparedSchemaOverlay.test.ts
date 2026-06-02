import {
  PreparedSchemaOverlayRegistry,
  type PreparedRenderRowDto,
  type SchemaOverlayAttachRequestDto
} from "../../../src/BlazorJsonVisualizer.Runtime/runtime-core/index.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

const rows: PreparedRenderRowDto[] = [
  { rowIndex: 0, kind: "node", nodeId: "n-root", depth: 0, text: "{", path: "$" },
  { rowIndex: 1, kind: "node", nodeId: "n-name", depth: 1, text: '"name": "Example"', path: "$.name" },
  { rowIndex: 2, kind: "node", nodeId: "n-kind", depth: 1, text: '"kind": "demo"', path: "$.kind" },
  { rowIndex: 3, kind: "node", nodeId: "n-count", depth: 1, text: '"count": 12', path: "$.count" }
];

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Example Item",
  type: "object",
  required: ["name", "kind"],
  properties: {
    name: { type: "string", title: "Name", description: "Display name", minLength: 3 },
    kind: { $ref: "#/$defs/kind" },
    count: { type: "number", minimum: 1, maximum: 10 }
  },
  $defs: {
    kind: { type: "string", enum: ["demo", "test"], description: "Item kind" }
  }
};

const attachRequest: SchemaOverlayAttachRequestDto = {
  sessionId: "prepared-session",
  documentId: "prepared-document",
  baseRevision: 7,
  schemaId: "example-schema",
  source: { kind: "inline", schema },
  options: { maxDiagnostics: 10, includeUnsupportedKeywordDiagnostics: true }
};

const snapshot = {
  sessionId: "prepared-session",
  documentId: "prepared-document",
  revision: 7,
  rows,
  nodePathsById: Object.fromEntries(rows.map((row) => [row.nodeId ?? "", row.path ?? ""])),
  valuesByPath: { "$.name": "Example", "$.kind": "demo", "$.count": 12 }
};

{
  const registry = new PreparedSchemaOverlayRegistry();
  const attach = registry.attach(attachRequest, 7);
  assert(attach.success, "schema attaches to prepared session");
  assert(attach.revision === 7, "attach preserves prepared revision");
  assert(attach.overlayId !== undefined, "attach returns overlay identity");

  const details = registry.getDetails(
    {
      sessionId: "prepared-session",
      documentId: "prepared-document",
      revision: 7,
      target: { kind: "jsonPointer", path: "/kind" }
    },
    snapshot
  );
  assert(details.success, "json pointer schema details resolve");
  assert(details.metadata?.description === "Item kind", "local $ref metadata resolves");
  assert(details.metadata?.enumValues?.length === 2, "enum metadata is included");

  const nodeDetails = registry.getDetails(
    {
      sessionId: "prepared-session",
      documentId: "prepared-document",
      revision: 7,
      target: { kind: "node", nodeId: "n-name" }
    },
    snapshot
  );
  assert(nodeDetails.metadata?.title === "Name", "node-to-path schema details resolve");

  const diagnostics = registry.getDiagnostics(
    { sessionId: "prepared-session", documentId: "prepared-document", revision: 7, maxDiagnostics: 5 },
    snapshot
  );
  assert(
    diagnostics.diagnostics.some((diagnostic) => diagnostic.category === "validationFailed"),
    "validation diagnostics are produced for supported keywords"
  );
  assert(
    diagnostics.diagnostics.some((diagnostic) => diagnostic.path === "$.count"),
    "validation diagnostics include path identity"
  );

  const decorations = registry.getRowDecorations(
    { sessionId: "prepared-session", documentId: "prepared-document", revision: 7, rows, maxDecorations: 10 },
    snapshot
  );
  assert(
    decorations.decorations.some((decoration) => decoration.rowIndex === 2 && decoration.markerKinds.includes("enum")),
    "row decorations include schema markers"
  );
  assert(
    decorations.decorations.some((decoration) => decoration.rowIndex === 3 && decoration.hasDiagnostics),
    "row decorations include validation state"
  );

  const stale = registry.getDetails(
    {
      sessionId: "prepared-session",
      documentId: "prepared-document",
      revision: 6,
      target: { kind: "jsonPointer", path: "/name" }
    },
    { ...snapshot, revision: 7 }
  );
  assert(!stale.success, "stale revision details fail");
  assert(stale.diagnostics[0]?.category === "revisionMismatch", "stale revision returns revision mismatch diagnostic");

  const detach = registry.detach({
    sessionId: "prepared-session",
    documentId: "prepared-document",
    overlayId: attach.overlayId
  });
  assert(detach.success, "schema overlay detaches");
  const afterDetach = registry.getDiagnostics(
    { sessionId: "prepared-session", documentId: "prepared-document", revision: 7, maxDiagnostics: 5 },
    snapshot
  );
  assert(afterDetach.diagnostics[0]?.category === "schemaNotAttached", "detached schema reports schemaNotAttached");
}

{
  const registry = new PreparedSchemaOverlayRegistry();
  const invalid = registry.attach(
    { ...attachRequest, source: { kind: "unsupported", sourceDescription: "remote" } },
    7
  );
  assert(!invalid.success, "unsupported schema source fails clearly");
  assert(invalid.diagnostics[0]?.category === "unsupportedOperation", "unsupported source emits structured diagnostic");
}

console.log("preparedSchemaOverlay tests passed");
