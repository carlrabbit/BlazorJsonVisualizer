import {
  type AttachSchemaCommand,
  type ApplyTransactionCommand,
  type CreateSessionCommand,
  type DetachSchemaCommand,
  type DisposeSessionCommand,
  type DocumentSessionRecord,
  type GetSchemaMetadataForPathCommand,
  type LoadTextDocumentCommand,
  type RedoCommand,
  type RevealPathCommand,
  type RuntimeEventDto,
  type SchemaDiagnosticDto,
  type SchemaNodeMetadataDto,
  type StructuralIndexDocument,
  type StructuralNodeRecord,
  type TransactionCommandResult,
  type ToggleFoldCommand,
  type UndoCommand,
  type SetViewportCommand,
  SessionRegistry,
  listChildNodeIds
} from "../runtime-core/index.js";

export type HostEventCallback = (event: RuntimeEventDto) => void | Promise<void>;

export interface DomRuntimeController {
  createSession(command: CreateSessionCommand, eventCallback?: HostEventCallback): Promise<void>;
  loadTextDocument(command: LoadTextDocumentCommand): Promise<void>;
  attachSchema(command: AttachSchemaCommand): Promise<void>;
  detachSchema(command: DetachSchemaCommand): Promise<void>;
  getSchemaMetadataForPath(command: GetSchemaMetadataForPathCommand): Promise<SchemaNodeMetadataDto | undefined>;
  setViewport(command: SetViewportCommand): Promise<void>;
  toggleFold(command: ToggleFoldCommand): Promise<void>;
  revealPath(command: RevealPathCommand): Promise<void>;
  applyTransaction(command: ApplyTransactionCommand): Promise<void>;
  undo(command: UndoCommand): Promise<void>;
  redo(command: RedoCommand): Promise<void>;
  disposeSession(command: DisposeSessionCommand): Promise<void>;
}

class DomRuntimeControllerImpl implements DomRuntimeController {
  private readonly sessionRegistry = new SessionRegistry();
  private readonly hostCallbacks = new Map<string, HostEventCallback>();
  private readonly hostElements = new Map<string, HTMLElement>();

  public async createSession(command: CreateSessionCommand, eventCallback?: HostEventCallback): Promise<void> {
    this.sessionRegistry.createSession(command);

    if (eventCallback !== undefined) {
      this.hostCallbacks.set(command.sessionId, eventCallback);
    }

    try {
      this.hostElements.set(command.sessionId, this.requireHostElement(command.hostElementId));
      this.sessionRegistry.mountSession(command.sessionId);
      this.render(command.sessionId);
      await this.emit({ type: "sessionCreated", sessionId: command.sessionId });
    } catch (error) {
      await this.emit({
        type: "runtimeError",
        sessionId: command.sessionId,
        message: toMessage(error),
        recoverable: false
      });
      this.hostCallbacks.delete(command.sessionId);
      this.hostElements.delete(command.sessionId);
      this.sessionRegistry.disposeSession({ sessionId: command.sessionId });
      throw error;
    }
  }

  public async loadTextDocument(command: LoadTextDocumentCommand): Promise<void> {
    const session = this.sessionRegistry.loadTextDocument(command);
    this.render(command.sessionId);
    await this.emit({
      type: "diagnosticsChanged",
      sessionId: command.sessionId,
      diagnostics: session.diagnostics
    });

    if (session.document !== undefined) {
      await this.emit({
        type: "documentLoaded",
        sessionId: command.sessionId,
        documentId: command.documentId,
        nodeCount: session.document.nodeCount
      });
    }
  }

  public async attachSchema(command: AttachSchemaCommand): Promise<void> {
    const update = this.sessionRegistry.attachSchema(command);
    this.render(command.sessionId);
    await this.emit({
      type: "schemaAttached",
      sessionId: command.sessionId,
      schemaId: command.schemaId
    });
    await this.emit({
      type: "schemaMetadataChanged",
      sessionId: command.sessionId,
      affectedNodeIds: update.affectedNodeIds
    });
    await this.emit({
      type: "schemaDiagnosticsChanged",
      sessionId: command.sessionId,
      diagnostics: update.diagnostics,
      schemaDiagnostics: update.diagnostics
    });
  }

  public async detachSchema(command: DetachSchemaCommand): Promise<void> {
    const update = this.sessionRegistry.detachSchema(command);
    this.render(command.sessionId);
    await this.emit({
      type: "schemaMetadataChanged",
      sessionId: command.sessionId,
      affectedNodeIds: update.affectedNodeIds
    });
    await this.emit({
      type: "schemaDiagnosticsChanged",
      sessionId: command.sessionId,
      diagnostics: update.diagnostics,
      schemaDiagnostics: update.diagnostics
    });
  }

  public async getSchemaMetadataForPath(command: GetSchemaMetadataForPathCommand): Promise<SchemaNodeMetadataDto | undefined> {
    return this.sessionRegistry.getSchemaMetadataForPath(command);
  }

  public async setViewport(command: SetViewportCommand): Promise<void> {
    this.sessionRegistry.setViewport(command);
    this.render(command.sessionId);
  }

  public async toggleFold(command: ToggleFoldCommand): Promise<void> {
    this.sessionRegistry.toggleFold(command);
    this.render(command.sessionId);
  }

  public async revealPath(command: RevealPathCommand): Promise<void> {
    const session = this.sessionRegistry.revealPath(command);
    this.render(command.sessionId);

    if (session.revealTargetNodeId !== undefined) {
      this.scrollToNode(command.sessionId, session.revealTargetNodeId);
      this.sessionRegistry.clearRevealTarget(command.sessionId);
    }
  }

  public async applyTransaction(command: ApplyTransactionCommand): Promise<void> {
    await this.handleTransactionResult(command.sessionId, this.sessionRegistry.applyTransaction(command));
  }

  public async undo(command: UndoCommand): Promise<void> {
    await this.handleTransactionResult(command.sessionId, this.sessionRegistry.undo(command));
  }

  public async redo(command: RedoCommand): Promise<void> {
    await this.handleTransactionResult(command.sessionId, this.sessionRegistry.redo(command));
  }

  public async disposeSession(command: DisposeSessionCommand): Promise<void> {
    const hostElement = this.hostElements.get(command.sessionId);

    if (hostElement !== undefined) {
      hostElement.replaceChildren();
    }

    this.sessionRegistry.disposeSession(command);
    this.hostElements.delete(command.sessionId);
    await this.emit({ type: "sessionDisposed", sessionId: command.sessionId });
    this.hostCallbacks.delete(command.sessionId);
  }

  private requireHostElement(hostElementId: string): HTMLElement {
    const hostElement = document.getElementById(hostElementId);

    if (hostElement === null) {
      throw new Error(`Unable to find host element '${hostElementId}'.`);
    }

    return hostElement;
  }

  private render(sessionId: string): void {
    const session = this.sessionRegistry.getSession(sessionId);
    const hostElement = this.hostElements.get(sessionId);

    if (session === undefined || hostElement === undefined) {
      return;
    }

    hostElement.replaceChildren(createRuntimeView(session, (nodeId) => {
      void this.toggleFold({ nodeId, sessionId });
    }));
  }

  private scrollToNode(sessionId: string, nodeId: string): void {
    const hostElement = this.hostElements.get(sessionId);
    const targetElement = [...(hostElement?.querySelectorAll<HTMLElement>("[data-node-id]") ?? [])].find(
      (element) => element.dataset.nodeId === nodeId
    );
    targetElement?.scrollIntoView({ block: "nearest" });
  }

  private async emit(event: RuntimeEventDto): Promise<void> {
    const callback = this.hostCallbacks.get(event.sessionId);

    if (callback === undefined) {
      return;
    }

    await callback(event);
  }

  private async handleTransactionResult(sessionId: string, result: TransactionCommandResult): Promise<void> {
    if (!result.accepted) {
      await this.emit({
        type: "transactionRejected",
        sessionId: result.sessionId,
        transactionId: result.transactionId,
        reason: result.reason
      });
      return;
    }

    this.render(sessionId);
    await this.emit({
      type: "transactionApplied",
      sessionId,
      transactionId: result.patch.transactionId,
      baseRevision: result.patch.baseRevision,
      newRevision: result.patch.newRevision
    });
    await this.emit({
      type: "documentPatchProduced",
      sessionId,
      patch: result.patch
    });
    await this.emit({
      type: "schemaMetadataChanged",
      sessionId,
      affectedNodeIds: []
    });
    await this.emit({
      type: "schemaDiagnosticsChanged",
      sessionId,
      diagnostics: [],
      schemaDiagnostics: []
    });
  }
}

function createRuntimeView(session: DocumentSessionRecord, toggleFold: (nodeId: string) => void): HTMLElement {
  const container = document.createElement("section");
  container.className = "bjv-runtime";
  container.append(createStyles());

  if (session.document === undefined) {
    if (session.text === undefined) {
      const emptyState = document.createElement("p");
      emptyState.className = "bjv-empty-state";
      emptyState.textContent = "Load a JSON document to begin rendering.";
      container.append(emptyState);
      return container;
    }

    container.append(createDiagnosticsPanel("Parse diagnostics", session.diagnostics.map((diagnostic) => `${diagnostic.message} (${diagnostic.startOffset}-${diagnostic.endOffset})`)));
    return container;
  }

  if (session.diagnostics.length > 0) {
    container.append(createDiagnosticsPanel("Parse diagnostics", session.diagnostics.map((diagnostic) => `${diagnostic.message} (${diagnostic.startOffset}-${diagnostic.endOffset})`)));
  }

  if (session.schemaDiagnostics.length > 0) {
    container.append(createDiagnosticsPanel("Schema diagnostics", session.schemaDiagnostics.map((diagnostic) => `${diagnostic.message} (${diagnostic.path})`)));
  }

  const documentContainer = document.createElement("div");
  documentContainer.className = "bjv-document";
  appendValueLines(
    documentContainer,
    session.document,
    session.document.rootNodeId,
    0,
    false,
    undefined,
    toggleFold,
    session.schemaMetadataByNodeId,
    session.schemaDiagnostics
  );
  container.append(documentContainer);
  return container;
}

function appendValueLines(
  container: HTMLElement,
  document: StructuralIndexDocument,
  nodeId: string,
  indentLevel: number,
  trailingComma: boolean,
  propertyName: string | undefined,
  toggleFold: (nodeId: string) => void,
  schemaMetadataByNodeId: Record<string, SchemaNodeMetadataDto>,
  schemaDiagnostics: SchemaDiagnosticDto[]
): void {
  const node = document.nodesById[nodeId];

  switch (node.kind) {
    case "object":
      appendFoldableLines(
        container,
        document,
        node,
        indentLevel,
        trailingComma,
        propertyName,
        "{",
        "}",
        toggleFold,
        schemaMetadataByNodeId,
        schemaDiagnostics
      );
      return;
    case "array":
      appendFoldableLines(
        container,
        document,
        node,
        indentLevel,
        trailingComma,
        propertyName,
        "[",
        "]",
        toggleFold,
        schemaMetadataByNodeId,
        schemaDiagnostics
      );
      return;
    case "string":
      container.append(
        createScalarLine(
          node,
          indentLevel,
          trailingComma,
          propertyName,
          JSON.stringify(node.scalarValue),
          "string",
          schemaMetadataByNodeId[node.nodeId],
          schemaDiagnostics
        )
      );
      return;
    case "number":
      container.append(
        createScalarLine(
          node,
          indentLevel,
          trailingComma,
          propertyName,
          String(node.scalarValue),
          "number",
          schemaMetadataByNodeId[node.nodeId],
          schemaDiagnostics
        )
      );
      return;
    case "boolean":
      container.append(
        createScalarLine(
          node,
          indentLevel,
          trailingComma,
          propertyName,
          String(node.scalarValue),
          "boolean",
          schemaMetadataByNodeId[node.nodeId],
          schemaDiagnostics
        )
      );
      return;
    case "null":
      container.append(
        createScalarLine(
          node,
          indentLevel,
          trailingComma,
          propertyName,
          "null",
          "null",
          schemaMetadataByNodeId[node.nodeId],
          schemaDiagnostics
        )
      );
      return;
    case "property":
      return;
  }
}

function appendFoldableLines(
  container: HTMLElement,
  document: StructuralIndexDocument,
  node: StructuralNodeRecord,
  indentLevel: number,
  trailingComma: boolean,
  propertyName: string | undefined,
  openCharacter: "{" | "[",
  closeCharacter: "}" | "]",
  toggleFold: (nodeId: string) => void,
  schemaMetadataByNodeId: Record<string, SchemaNodeMetadataDto>,
  schemaDiagnostics: SchemaDiagnosticDto[]
): void {
  const childNodeIds = listChildNodeIds(document, node.nodeId);
  const openingLine = createLine(node.nodeId, indentLevel, schemaDiagnostics);
  applySchemaMetadata(openingLine, schemaMetadataByNodeId[node.nodeId], propertyName);
  openingLine.append(createFoldButton(node, toggleFold));
  appendPropertyName(openingLine, propertyName);
  openingLine.append(createTokenSpan("punctuation", openCharacter));

  if (childNodeIds.length === 0) {
    openingLine.append(createTokenSpan("punctuation", closeCharacter));
    appendTrailingComma(openingLine, trailingComma);
    container.append(openingLine);
    return;
  }

  if (node.folded) {
    openingLine.append(createCollapsedSpan());
    openingLine.append(createTokenSpan("punctuation", closeCharacter));
    appendTrailingComma(openingLine, trailingComma);
    container.append(openingLine);
    return;
  }

  container.append(openingLine);

  if (node.kind === "object") {
    childNodeIds.forEach((propertyNodeId, index) => {
      const propertyNode = document.nodesById[propertyNodeId];
      const valueNodeId = propertyNode.firstChildId;

      if (valueNodeId === undefined) {
        console.warn(`Property node ${propertyNode.nodeId} (${propertyNode.propertyName ?? "unknown"}) is missing its value node.`);
        return;
      }

      appendValueLines(
        container,
        document,
        valueNodeId,
        indentLevel + 1,
        index < childNodeIds.length - 1,
        propertyNode.propertyName,
        toggleFold,
        schemaMetadataByNodeId,
        schemaDiagnostics
      );
    });
  } else {
    childNodeIds.forEach((childNodeId, index) => {
      appendValueLines(
        container,
        document,
        childNodeId,
        indentLevel + 1,
        index < childNodeIds.length - 1,
        undefined,
        toggleFold,
        schemaMetadataByNodeId,
        schemaDiagnostics
      );
    });
  }

  const closingLine = createLine(undefined, indentLevel, schemaDiagnostics);
  closingLine.append(createFoldSpacer());
  closingLine.append(createTokenSpan("punctuation", closeCharacter));
  appendTrailingComma(closingLine, trailingComma);
  container.append(closingLine);
}

function createScalarLine(
  node: StructuralNodeRecord,
  indentLevel: number,
  trailingComma: boolean,
  propertyName: string | undefined,
  valueText: string,
  tokenKind: "string" | "number" | "boolean" | "null",
  schemaMetadata: SchemaNodeMetadataDto | undefined,
  schemaDiagnostics: SchemaDiagnosticDto[]
): HTMLElement {
  const line = createLine(node.nodeId, indentLevel, schemaDiagnostics);
  applySchemaMetadata(line, schemaMetadata, propertyName);
  line.append(createFoldSpacer());
  appendPropertyName(line, propertyName);
  line.append(createTokenSpan(tokenKind, valueText));
  appendTrailingComma(line, trailingComma);
  return line;
}

function createLine(nodeId: string | undefined, indentLevel: number, schemaDiagnostics: SchemaDiagnosticDto[]): HTMLElement {
  const line = document.createElement("div");
  line.className = "bjv-line";
  line.style.paddingLeft = `${indentLevel * 1.5}rem`;

  if (nodeId !== undefined) {
    line.dataset.nodeId = nodeId;
    if (schemaDiagnostics.some((diagnostic) => diagnostic.nodeId === nodeId)) {
      line.classList.add("bjv-line-schema-error");
      line.append(createSchemaDiagnosticMarker());
    }
  }

  return line;
}

function createFoldButton(node: StructuralNodeRecord, toggleFold: (nodeId: string) => void): HTMLElement {
  const button = document.createElement("button");
  button.className = "bjv-fold-button";
  button.type = "button";
  button.textContent = node.folded ? "▸" : "▾";
  button.title = node.folded ? "Expand" : "Collapse";
  button.addEventListener("click", () => toggleFold(node.nodeId));
  return button;
}

function createFoldSpacer(): HTMLElement {
  const spacer = document.createElement("span");
  spacer.className = "bjv-fold-spacer";
  spacer.textContent = " ";
  return spacer;
}

function appendPropertyName(line: HTMLElement, propertyName: string | undefined): void {
  if (propertyName === undefined) {
    return;
  }

  line.append(createTokenSpan("property", JSON.stringify(propertyName)));
  line.append(createTokenSpan("punctuation", ": "));
}

function appendTrailingComma(line: HTMLElement, trailingComma: boolean): void {
  if (!trailingComma) {
    return;
  }

  line.append(createTokenSpan("punctuation", ","));
}

function createTokenSpan(tokenKind: string, text: string): HTMLElement {
  const span = document.createElement("span");
  span.className = `bjv-token bjv-token-${tokenKind}`;
  span.textContent = text;
  return span;
}

function createCollapsedSpan(): HTMLElement {
  const span = document.createElement("span");
  span.className = "bjv-token bjv-token-collapsed";
  span.textContent = "…";
  return span;
}

function createSchemaDiagnosticMarker(): HTMLElement {
  const marker = document.createElement("span");
  marker.className = "bjv-schema-marker";
  marker.textContent = "⚠ ";
  return marker;
}

function applySchemaMetadata(line: HTMLElement, metadata: SchemaNodeMetadataDto | undefined, propertyName: string | undefined): void {
  if (metadata === undefined) {
    return;
  }

  const hoverParts = [metadata.title, metadata.description].filter((part): part is string => typeof part === "string" && part.length > 0);
  if (hoverParts.length > 0) {
    line.title = hoverParts.join(" — ");
  }

  if (propertyName !== undefined && metadata.required) {
    const requiredToken = document.createElement("span");
    requiredToken.className = "bjv-schema-required";
    requiredToken.textContent = " *required";
    line.append(requiredToken);
  }

  if (Array.isArray(metadata.enumValues) && metadata.enumValues.length > 0) {
    const enumToken = document.createElement("span");
    enumToken.className = "bjv-schema-enum";
    enumToken.textContent = ` ⟪enum: ${metadata.enumValues.map((value) => JSON.stringify(value)).join(", ")}⟫`;
    line.append(enumToken);
  }
}

function createDiagnosticsPanel(title: string, diagnostics: string[]): HTMLElement {
  const panel = document.createElement("section");
  panel.className = "bjv-diagnostics";

  const heading = document.createElement("h2");
  heading.className = "bjv-diagnostics-title";
  heading.textContent = diagnostics.length === 0 ? `No ${title.toLowerCase()}` : title;
  panel.append(heading);

  if (diagnostics.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "bjv-diagnostics-empty";
    emptyText.textContent = `No ${title.toLowerCase()}.`;
    panel.append(emptyText);
    return panel;
  }

  const list = document.createElement("ul");
  list.className = "bjv-diagnostics-list";

  for (const diagnostic of diagnostics) {
    const item = document.createElement("li");
    item.className = "bjv-diagnostics-item";
    item.textContent = diagnostic;
    list.append(item);
  }

  panel.append(list);
  return panel;
}

function createStyles(): HTMLElement {
  const style = document.createElement("style");
  style.textContent = `
    .bjv-runtime {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      overflow: auto;
      padding: 0.75rem;
      max-height: 28rem;
      box-sizing: border-box;
    }

    .bjv-document {
      white-space: pre;
      line-height: 1.5;
    }

    .bjv-line {
      min-height: 1.5rem;
    }

    .bjv-line-schema-error {
      background: #fef2f2;
    }

    .bjv-schema-marker {
      color: #b91c1c;
    }

    .bjv-schema-required {
      color: #b45309;
      font-family: system-ui, sans-serif;
      font-size: 0.75rem;
      margin-right: 0.25rem;
    }

    .bjv-schema-enum {
      color: #475569;
      font-family: system-ui, sans-serif;
      font-size: 0.75rem;
      margin-left: 0.25rem;
    }

    .bjv-empty-state,
    .bjv-diagnostics-empty,
    .bjv-diagnostics-title {
      font-family: system-ui, sans-serif;
      margin: 0 0 0.5rem;
    }

    .bjv-diagnostics {
      margin-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.75rem;
      font-family: system-ui, sans-serif;
    }

    .bjv-diagnostics-list {
      margin: 0;
      padding-left: 1.25rem;
    }

    .bjv-diagnostics-item {
      color: #991b1b;
      margin: 0.25rem 0;
    }

    .bjv-fold-button {
      appearance: none;
      border: none;
      background: transparent;
      color: #334155;
      cursor: pointer;
      width: 1rem;
      margin-right: 0.25rem;
      padding: 0;
      font: inherit;
    }

    .bjv-fold-spacer {
      display: inline-block;
      width: 1rem;
      margin-right: 0.25rem;
    }

    .bjv-token-property,
    .bjv-token-string {
      color: #0f766e;
    }

    .bjv-token-number {
      color: #7c3aed;
    }

    .bjv-token-boolean,
    .bjv-token-null {
      color: #1d4ed8;
    }

    .bjv-token-punctuation,
    .bjv-token-collapsed {
      color: #475569;
    }
  `;
  return style;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown runtime error occurred.";
}

export function createDomRuntimeController(): DomRuntimeController {
  return new DomRuntimeControllerImpl();
}
