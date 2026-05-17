import {
  type CreateSessionCommand,
  type DisposeSessionCommand,
  type DocumentSessionRecord,
  type LoadTextDocumentCommand,
  type RuntimeEventDto,
  type SetViewportCommand,
  SessionRegistry
} from "../runtime-core/index.js";

export type HostEventCallback = (event: RuntimeEventDto) => void | Promise<void>;

export interface DomRuntimeController {
  createSession(command: CreateSessionCommand, eventCallback?: HostEventCallback): Promise<void>;
  loadTextDocument(command: LoadTextDocumentCommand): Promise<void>;
  setViewport(command: SetViewportCommand): Promise<void>;
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
      await this.emit({
        type: "placeholderEvent",
        sessionId: command.sessionId,
        message: `Mounted runtime placeholder for session '${command.sessionId}'.`
      });
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
    this.sessionRegistry.loadTextDocument(command);
    this.render(command.sessionId);
    await this.emit({
      type: "placeholderEvent",
      sessionId: command.sessionId,
      message: `Loaded document '${command.documentId}'.`
    });
  }

  public async setViewport(command: SetViewportCommand): Promise<void> {
    this.sessionRegistry.setViewport(command);
    this.render(command.sessionId);
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

    hostElement.replaceChildren(createPlaceholder(session));
  }

  private async emit(event: RuntimeEventDto): Promise<void> {
    const callback = this.hostCallbacks.get(event.sessionId);

    if (callback === undefined) {
      return;
    }

    await callback(event);
  }
}

function createPlaceholder(session: DocumentSessionRecord): HTMLElement {
  const container = document.createElement("section");
  container.className = "bjv-runtime-placeholder";
  container.style.border = "1px solid #cbd5e1";
  container.style.borderRadius = "8px";
  container.style.padding = "1rem";
  container.style.backgroundColor = "#f8fafc";
  container.style.fontFamily = "system-ui, sans-serif";

  const title = document.createElement("h2");
  title.textContent = session.options?.placeholderText ?? "BlazorJsonVisualizer runtime placeholder";
  title.style.fontSize = "1rem";
  title.style.margin = "0 0 0.75rem";
  container.append(title);

  for (const line of describeSession(session)) {
    const item = document.createElement("p");
    item.textContent = line;
    item.style.margin = "0.25rem 0";
    container.append(item);
  }

  return container;
}

function describeSession(session: DocumentSessionRecord): string[] {
  const lines = [
    `Session: ${session.sessionId}`,
    `Lifecycle: ${session.lifecycleState}`
  ];

  if (session.documentId !== undefined) {
    lines.push(`Document: ${session.documentId}`);
  }

  if (session.viewport !== undefined) {
    lines.push(`Viewport: ${session.viewport.width} × ${session.viewport.height}`);
  }

  if (session.text !== undefined) {
    lines.push(`Characters loaded: ${session.text.length}`);
  }

  return lines;
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
