import type { RenderRow } from "../../../runtime-core/src/viewport/viewportTypes.js";

export interface RenderOptions {
  containerElement: Element;
}

export function createRowElement(row: RenderRow): Element {
  // Guard against missing document global (e.g. in Node.js test environments)
  const doc = typeof document !== "undefined" ? document : undefined;
  if (doc === undefined) {
    throw new Error("DOM not available");
  }

  const el = doc.createElement("div");
  el.setAttribute("data-row-index", String(row.rowIndex));
  el.setAttribute("data-depth", String(row.depth));

  if (row.nodeId !== undefined) {
    el.setAttribute("data-node-id", row.nodeId);
  }

  el.setAttribute("class", `json-row json-row--${row.kind} json-row--depth-${row.depth}`);
  el.textContent = row.text;

  return el;
}

export function renderRows(rows: RenderRow[], options: RenderOptions): void {
  const { containerElement } = options;

  // Remove existing child nodes
  while (containerElement.firstChild !== null) {
    containerElement.removeChild(containerElement.firstChild);
  }

  for (const row of rows) {
    const el = createRowElement(row);
    containerElement.appendChild(el);
  }
}
