import { createRowElement, renderRows } from "../../../src/runtime/runtime-dom/src/rendering/jsonViewRenderer.js";
import type { RenderRow } from "../../../src/runtime/runtime-core/src/viewport/viewportTypes.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// Minimal DOM mock
const elements: Array<{
  tag: string;
  attrs: Map<string, string>;
  textContent: string | null;
  children: any[];
}> = [];

function makeElement(tag: string) {
  const el: {
    tag: string;
    attrs: Map<string, string>;
    textContent: string | null;
    firstChild: any;
    children: any[];
    setAttribute(k: string, v: string): void;
    setAttribute(k: string, v: string): void;
    removeChild(child: any): void;
    appendChild(child: any): void;
  } = {
    tag,
    attrs: new Map<string, string>(),
    textContent: null,
    firstChild: null as any,
    children: [] as any[],
    setAttribute(k: string, v: string) { this.attrs.set(k, v); },
    removeChild(child: any) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      this.firstChild = this.children[0] ?? null;
    },
    appendChild(child: any) {
      this.children.push(child);
      this.firstChild = this.children[0];
    },
  };
  return el;
}

// Inject mock document into globalThis
(globalThis as any).document = {
  createElement(tag: string) {
    return makeElement(tag);
  }
};

// createRowElement basics
{
  const row: RenderRow = { rowIndex: 0, kind: "node", nodeId: "n1", depth: 1, text: '"key": 1' };
  const el = createRowElement(row) as any;
  assert(el.attrs.get("data-row-index") === "0", "rowIndex attr");
  assert(el.attrs.get("data-depth") === "1", "depth attr");
  assert(el.attrs.get("data-node-id") === "n1", "nodeId attr");
  assert(el.textContent === '"key": 1', "text content");
}

// createRowElement without nodeId
{
  const row: RenderRow = { rowIndex: 5, kind: "diagnostic", depth: 0, text: "error" };
  const el = createRowElement(row) as any;
  assert(el.attrs.get("data-node-id") === undefined, "no nodeId attr when absent");
}

// renderRows clears container and appends rows
{
  const container = makeElement("div") as any;
  // Pre-populate
  container.appendChild(makeElement("span"));
  assert(container.children.length === 1, "pre-populated");

  const rows: RenderRow[] = [
    { rowIndex: 0, kind: "node", depth: 0, text: "a" },
    { rowIndex: 1, kind: "node", depth: 1, text: "b" },
  ];
  renderRows(rows, { containerElement: container as any });
  assert(container.children.length === 2, `expected 2 children, got ${container.children.length}`);
}

// renderRows with empty rows clears container
{
  const container = makeElement("div") as any;
  container.appendChild(makeElement("span"));
  renderRows([], { containerElement: container as any });
  assert(container.children.length === 0, "cleared");
}

console.log("jsonViewRenderer tests passed");
