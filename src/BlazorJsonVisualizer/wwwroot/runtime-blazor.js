// ../runtime-core/index.ts
var RUNTIME_PROTOCOL_VERSION = "0.2.0-milestone-002";
var SessionRegistry = class {
  sessions = /* @__PURE__ */ new Map();
  createSession(command) {
    if (this.sessions.has(command.sessionId)) {
      throw new Error(`Session '${command.sessionId}' already exists.`);
    }
    const session = {
      hostElementId: command.hostElementId,
      lifecycleState: "created",
      sessionId: command.sessionId,
      ...command.options !== void 0 ? { options: command.options } : {}
    };
    this.sessions.set(command.sessionId, session);
    return session;
  }
  mountSession(sessionId) {
    return this.updateSession(sessionId, (session) => ({
      ...session,
      lifecycleState: "mounted"
    }));
  }
  loadTextDocument(command) {
    return this.updateSession(command.sessionId, (session) => ({
      ...session,
      contentType: command.contentType,
      documentId: command.documentId,
      lifecycleState: "document-loaded",
      text: command.text
    }));
  }
  setViewport(command) {
    return this.updateSession(command.sessionId, (session) => ({
      ...session,
      viewport: {
        height: command.height,
        width: command.width
      }
    }));
  }
  disposeSession(command) {
    const session = this.requireSession(command.sessionId);
    const disposedSession = {
      ...session,
      lifecycleState: "disposed"
    };
    this.sessions.delete(command.sessionId);
    return disposedSession;
  }
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
  listSessionIds() {
    return [...this.sessions.keys()];
  }
  updateSession(sessionId, update) {
    const session = this.requireSession(sessionId);
    const updatedSession = update(session);
    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }
  requireSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session === void 0) {
      throw new Error(`Session '${sessionId}' is not available.`);
    }
    if (session.lifecycleState === "disposed") {
      throw new Error(`Session '${sessionId}' has been disposed.`);
    }
    return session;
  }
};

// ../runtime-dom/index.ts
var DomRuntimeControllerImpl = class {
  sessionRegistry = new SessionRegistry();
  hostCallbacks = /* @__PURE__ */ new Map();
  hostElements = /* @__PURE__ */ new Map();
  async createSession(command, eventCallback) {
    this.sessionRegistry.createSession(command);
    if (eventCallback !== void 0) {
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
  async loadTextDocument(command) {
    this.sessionRegistry.loadTextDocument(command);
    this.render(command.sessionId);
    await this.emit({
      type: "placeholderEvent",
      sessionId: command.sessionId,
      message: `Loaded document '${command.documentId}'.`
    });
  }
  async setViewport(command) {
    this.sessionRegistry.setViewport(command);
    this.render(command.sessionId);
  }
  async disposeSession(command) {
    const hostElement = this.hostElements.get(command.sessionId);
    if (hostElement !== void 0) {
      hostElement.replaceChildren();
    }
    this.sessionRegistry.disposeSession(command);
    this.hostElements.delete(command.sessionId);
    await this.emit({ type: "sessionDisposed", sessionId: command.sessionId });
    this.hostCallbacks.delete(command.sessionId);
  }
  requireHostElement(hostElementId) {
    const hostElement = document.getElementById(hostElementId);
    if (hostElement === null) {
      throw new Error(`Unable to find host element '${hostElementId}'.`);
    }
    return hostElement;
  }
  render(sessionId) {
    const session = this.sessionRegistry.getSession(sessionId);
    const hostElement = this.hostElements.get(sessionId);
    if (session === void 0 || hostElement === void 0) {
      return;
    }
    hostElement.replaceChildren(createPlaceholder(session));
  }
  async emit(event) {
    const callback = this.hostCallbacks.get(event.sessionId);
    if (callback === void 0) {
      return;
    }
    await callback(event);
  }
};
function createPlaceholder(session) {
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
function describeSession(session) {
  const lines = [
    `Session: ${session.sessionId}`,
    `Lifecycle: ${session.lifecycleState}`
  ];
  if (session.documentId !== void 0) {
    lines.push(`Document: ${session.documentId}`);
  }
  if (session.viewport !== void 0) {
    lines.push(`Viewport: ${session.viewport.width} \xD7 ${session.viewport.height}`);
  }
  if (session.text !== void 0) {
    lines.push(`Characters loaded: ${session.text.length}`);
  }
  return lines;
}
function toMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown runtime error occurred.";
}
function createDomRuntimeController() {
  return new DomRuntimeControllerImpl();
}

// index.ts
var domRuntimeController = createDomRuntimeController();
async function createSession(command, callbackTarget) {
  await domRuntimeController.createSession(command, createCallback(callbackTarget));
}
async function disposeSession(command) {
  await domRuntimeController.disposeSession(command);
}
async function loadTextDocument(command) {
  await domRuntimeController.loadTextDocument(command);
}
async function setViewport(command) {
  await domRuntimeController.setViewport(command);
}
function getRuntimeProtocolVersion() {
  return RUNTIME_PROTOCOL_VERSION;
}
function createCallback(callbackTarget) {
  if (callbackTarget === void 0) {
    return void 0;
  }
  return async (event) => {
    await callbackTarget.invokeMethodAsync("HandleRuntimeEvent", event);
  };
}
var runtimeBlazorModule = {
  createSession,
  disposeSession,
  getRuntimeProtocolVersion,
  loadTextDocument,
  setViewport
};
if (typeof window !== "undefined") {
  window.BlazorJsonVisualizerRuntime = runtimeBlazorModule;
}
export {
  createSession,
  disposeSession,
  getRuntimeProtocolVersion,
  loadTextDocument,
  setViewport
};
