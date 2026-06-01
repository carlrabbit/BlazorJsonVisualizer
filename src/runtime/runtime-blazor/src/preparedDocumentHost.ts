import type {
  CreateSessionCommand,
  PreparedOpenRequestDto,
  PreparedOpenResultDto,
  PreparedRenderRowDto,
  PreparedRevealRequestDto,
  PreparedRevealResultDto,
  PreparedRowsResultDto,
  PreparedSearchRequestDto,
  PreparedSearchResultPageDto,
  PreparedViewportRequestDto,
  RuntimeDiagnosticDto,
  RuntimeEventDto
} from "../../runtime-core/index.js";
import { createPreparedDocumentRuntimeClient, type PreparedDocumentRuntimeClient } from "./preparedDocumentRuntimeClient.js";

const ROW_HEIGHT_PX = 22;
const DEFAULT_VIEWPORT: PreparedViewportRequestDto = { firstRow: 0, rowCount: 50 };

export interface DotNetPreparedCallbackTarget {
  invokeMethodAsync<T>(methodName: string, ...args: unknown[]): Promise<T>;
}

interface RegisteredPreparedHostSession {
  hostElementId: string;
  callbackTarget?: DotNetPreparedCallbackTarget | undefined;
  prepared?: PreparedBrowserSession | undefined;
}

interface PreparedBrowserSession {
  sessionId: string;
  documentId: string;
  hostElement: HTMLElement;
  callbackTarget?: DotNetPreparedCallbackTarget | undefined;
  client: PreparedDocumentRuntimeClient;
  viewport: PreparedViewportRequestDto;
  foldStateRevision: number;
  diagnostics: RuntimeDiagnosticDto[];
  rows: PreparedRowsResultDto | undefined;
  totalKnownRows: number;
  focusedNodeId?: string | undefined;
}

export class PreparedDocumentHost {
  private readonly sessions = new Map<string, RegisteredPreparedHostSession>();

  public registerSession(command: CreateSessionCommand, callbackTarget?: DotNetPreparedCallbackTarget): void {
    this.sessions.set(command.sessionId, {
      hostElementId: command.hostElementId,
      callbackTarget
    });
  }

  public async unregisterSession(sessionId: string): Promise<void> {
    const registeredSession = this.sessions.get(sessionId);
    if (registeredSession?.prepared !== undefined) {
      await registeredSession.prepared.client.closePreparedDocumentSession(sessionId);
    }

    this.sessions.delete(sessionId);
  }

  public async closePreparedDocumentSession(sessionId: string): Promise<void> {
    const registeredSession = this.sessions.get(sessionId);
    if (registeredSession?.prepared === undefined) {
      return;
    }

    await registeredSession.prepared.client.closePreparedDocumentSession(sessionId);
    registeredSession.prepared = undefined;
    const hostElement = this.requireHostElement(registeredSession.hostElementId);
    hostElement.replaceChildren();
  }

  public async openPreparedDocumentSession(request: PreparedOpenRequestDto): Promise<void> {
    const registeredSession = this.requireRegisteredSession(request.sessionId);
    if (registeredSession.callbackTarget === undefined) {
      throw new Error(`Prepared document session '${request.sessionId}' requires a .NET callback target.`);
    }

    const hostElement = this.requireHostElement(registeredSession.hostElementId);
    const client = createPreparedDocumentRuntimeClient(registeredSession.callbackTarget);
    const openResult = await client.openPreparedDocumentSession(request);
    const preparedSession: PreparedBrowserSession = {
      sessionId: request.sessionId,
      documentId: request.documentId,
      hostElement,
      callbackTarget: registeredSession.callbackTarget,
      client,
      viewport: request.initialViewport ?? DEFAULT_VIEWPORT,
      foldStateRevision: 0,
      diagnostics: openResult.diagnostics ?? [],
      rows: undefined,
      totalKnownRows: 0
    };
    registeredSession.prepared = preparedSession;

    if (openResult.success) {
      await this.refreshRows(preparedSession);
      await this.emit(preparedSession, {
        type: "documentLoaded",
        sessionId: preparedSession.sessionId,
        documentId: preparedSession.documentId,
        nodeCount: preparedSession.rows?.totalKnownRows ?? 0
      });
    }

    await this.emitDiagnostics(preparedSession);
    this.render(preparedSession);
  }

  public async searchPreparedDocument(request: PreparedSearchRequestDto): Promise<PreparedSearchResultPageDto> {
    const preparedSession = this.requirePreparedSession(request.sessionId);
    const result = await preparedSession.client.searchPreparedDocument(request);
    preparedSession.diagnostics = result.diagnostics ?? [];
    await this.emitDiagnostics(preparedSession);
    this.render(preparedSession);
    return result;
  }

  public async revealPreparedLocation(request: PreparedRevealRequestDto): Promise<PreparedRevealResultDto> {
    const preparedSession = this.requirePreparedSession(request.sessionId);
    const result = await preparedSession.client.revealPreparedLocation(request);
    preparedSession.diagnostics = result.diagnostics ?? [];
    if (result.success && result.viewport !== undefined) {
      preparedSession.viewport = result.viewport;
      preparedSession.focusedNodeId = result.nodeId;
      await this.refreshRows(preparedSession);
    }

    await this.emitDiagnostics(preparedSession);
    this.render(preparedSession);
    if (result.success && result.rowIndex !== undefined) {
      const scrollTop = result.rowIndex * ROW_HEIGHT_PX;
      const container = preparedSession.hostElement.querySelector<HTMLElement>(".bjv-prepared-scroll");
      if (container !== null) {
        container.scrollTop = scrollTop;
      }
    }

    return result;
  }

  private async refreshRows(session: PreparedBrowserSession): Promise<void> {
    const rows = await session.client.getPreparedRows({
      sessionId: session.sessionId,
      firstRow: session.viewport.firstRow,
      rowCount: session.viewport.rowCount,
      foldStateRevision: session.foldStateRevision
    });
    session.rows = rows;
    session.totalKnownRows = rows.totalKnownRows ?? rows.rows.length;
    session.diagnostics = rows.diagnostics ?? session.diagnostics;
  }

  private render(session: PreparedBrowserSession): void {
    session.hostElement.replaceChildren();
    session.hostElement.append(this.createStyles());

    const runtime = document.createElement("section");
    runtime.className = "bjv-prepared-runtime";

    if (session.diagnostics.length > 0) {
      runtime.append(this.createDiagnosticsPanel(session.diagnostics));
    }

    const scrollContainer = document.createElement("div");
    scrollContainer.className = "bjv-prepared-scroll";
    scrollContainer.addEventListener("scroll", () => {
      void this.handleScroll(session, scrollContainer);
    });

    const topSpacer = document.createElement("div");
    topSpacer.style.height = `${session.viewport.firstRow * ROW_HEIGHT_PX}px`;
    scrollContainer.append(topSpacer);

    for (const row of session.rows?.rows ?? []) {
      scrollContainer.append(this.createRowElement(session, row));
    }

    const trailingRowCount = Math.max(0, session.totalKnownRows - ((session.viewport.firstRow ?? 0) + (session.rows?.rows.length ?? 0)));
    const bottomSpacer = document.createElement("div");
    bottomSpacer.style.height = `${trailingRowCount * ROW_HEIGHT_PX}px`;
    scrollContainer.append(bottomSpacer);

    runtime.append(scrollContainer);
    session.hostElement.append(runtime);
  }

  private createRowElement(session: PreparedBrowserSession, row: PreparedRenderRowDto): HTMLElement {
    const rowElement = document.createElement("div");
    rowElement.className = "bjv-prepared-row";
    rowElement.style.paddingLeft = `${Math.max(0, row.depth) * 0.75}rem`;
    if (row.nodeId != null) {
      rowElement.dataset.nodeId = row.nodeId;
    }

    if (row.nodeId != null && row.folded != null) {
      const foldButton = document.createElement("button");
      foldButton.className = "bjv-prepared-fold";
      foldButton.textContent = row.folded ? "+" : "−";
      foldButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.toggleFold(session, row);
      });
      rowElement.append(foldButton);
    } else {
      const spacer = document.createElement("span");
      spacer.className = "bjv-prepared-fold-spacer";
      spacer.textContent = " ";
      rowElement.append(spacer);
    }

    const text = document.createElement("span");
    text.className = "bjv-prepared-row-text";
    text.textContent = row.text;
    rowElement.append(text);
    return rowElement;
  }

  private async toggleFold(session: PreparedBrowserSession, row: PreparedRenderRowDto): Promise<void> {
    if (row.nodeId == null || row.folded == null) {
      return;
    }

    const result = await session.client.setPreparedFoldState({
      sessionId: session.sessionId,
      nodeId: row.nodeId,
      folded: !row.folded
    });
    session.foldStateRevision = result.foldStateRevision;
    session.diagnostics = result.diagnostics ?? [];
    await this.refreshRows(session);
    await this.emitDiagnostics(session);
    this.render(session);
  }

  private async handleScroll(session: PreparedBrowserSession, container: HTMLElement): Promise<void> {
    if (session.totalKnownRows <= session.viewport.rowCount) {
      return;
    }

    const firstRow = Math.max(0, Math.floor(container.scrollTop / ROW_HEIGHT_PX));
    if (firstRow === session.viewport.firstRow) {
      return;
    }

    session.viewport = { ...session.viewport, firstRow };
    await this.refreshRows(session);
    await this.emit(session, {
      type: "placeholderEvent",
      sessionId: session.sessionId,
      message: `Prepared viewport moved to row ${firstRow}.`
    });
    await this.emitDiagnostics(session);
    this.render(session);
  }

  private createDiagnosticsPanel(diagnostics: RuntimeDiagnosticDto[]): HTMLElement {
    const panel = document.createElement("section");
    panel.className = "bjv-prepared-diagnostics";
    const title = document.createElement("h2");
    title.textContent = "Prepared document diagnostics";
    panel.append(title);

    const list = document.createElement("ul");
    for (const diagnostic of diagnostics) {
      const item = document.createElement("li");
      item.textContent = `${diagnostic.message} (${diagnostic.code})`;
      list.append(item);
    }

    panel.append(list);
    return panel;
  }

  private createStyles(): HTMLStyleElement {
    const styles = document.createElement("style");
    styles.textContent = `
.bjv-prepared-runtime {
  display: grid;
  gap: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.bjv-prepared-scroll {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  max-height: 28rem;
  overflow: auto;
  background: #0f172a;
  color: #e2e8f0;
}
.bjv-prepared-row {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  min-height: ${ROW_HEIGHT_PX}px;
  white-space: pre;
}
.bjv-prepared-row-text {
  white-space: pre;
}
.bjv-prepared-fold,
.bjv-prepared-fold-spacer {
  width: 1.25rem;
  display: inline-flex;
  justify-content: center;
  background: transparent;
  border: 0;
  color: #93c5fd;
}
.bjv-prepared-diagnostics {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #7f1d1d;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-family: system-ui, sans-serif;
}
.bjv-prepared-diagnostics h2 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
}
`;
    return styles;
  }

  private async emitDiagnostics(session: PreparedBrowserSession): Promise<void> {
    await this.emit(session, {
      type: "diagnosticsChanged",
      sessionId: session.sessionId,
      diagnostics: session.diagnostics
    });
  }

  private async emit(session: PreparedBrowserSession, event: RuntimeEventDto): Promise<void> {
    if (session.callbackTarget === undefined) {
      return;
    }

    await session.callbackTarget.invokeMethodAsync("HandleRuntimeEvent", event);
  }

  private requirePreparedSession(sessionId: string): PreparedBrowserSession {
    const prepared = this.sessions.get(sessionId)?.prepared;
    if (prepared === undefined) {
      throw new Error(`Prepared document session '${sessionId}' is not available.`);
    }

    return prepared;
  }

  private requireRegisteredSession(sessionId: string): RegisteredPreparedHostSession {
    const session = this.sessions.get(sessionId);
    if (session === undefined) {
      throw new Error(`Session '${sessionId}' must be created before opening a prepared document.`);
    }

    return session;
  }

  private requireHostElement(hostElementId: string): HTMLElement {
    const hostElement = document.getElementById(hostElementId);
    if (hostElement === null) {
      throw new Error(`Unable to find host element '${hostElementId}'.`);
    }

    return hostElement;
  }
}
