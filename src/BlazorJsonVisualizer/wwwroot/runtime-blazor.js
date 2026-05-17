// ../runtime-core/index.ts
var RUNTIME_PROTOCOL_VERSION = "0.3.0-milestone-003";
var JsonParseError = class extends Error {
  constructor(message, startOffset, endOffset, code = "json-syntax-error") {
    super(message);
    this.message = message;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.code = code;
    this.name = "JsonParseError";
  }
  message;
  startOffset;
  endOffset;
  code;
};
var JsonStructuralParser = class {
  constructor(text) {
    this.text = text;
  }
  text;
  position = 0;
  nextNodeNumber = 1;
  nodeOrder = [];
  nodesById = {};
  pathToNodeIds = {};
  lastChildByParentId = /* @__PURE__ */ new Map();
  parseDocument() {
    try {
      this.skipWhitespace();
      if (this.position >= this.text.length) {
        throw new JsonParseError("Expected a JSON value.", 0, 0);
      }
      const rootNodeId = this.parseValue(void 0, 0, "$", true);
      this.skipWhitespace();
      if (this.position < this.text.length) {
        throw new JsonParseError(
          "Unexpected trailing content after the root JSON value.",
          this.position,
          Math.min(this.text.length, this.position + 1)
        );
      }
      return {
        diagnostics: [],
        document: {
          rootNodeId,
          text: this.text,
          nodeCount: this.nodeOrder.length,
          nodeOrder: [...this.nodeOrder],
          nodesById: this.nodesById,
          pathToNodeIds: this.pathToNodeIds
        }
      };
    } catch (error) {
      const diagnostic = toDiagnostic(error, this.text.length);
      return {
        diagnostics: [diagnostic]
      };
    }
  }
  parseValue(parentId, depth, path, registerPath) {
    const character = this.text[this.position];
    switch (character) {
      case "{":
        return this.parseObject(parentId, depth, path, registerPath);
      case "[":
        return this.parseArray(parentId, depth, path, registerPath);
      case '"':
        return this.parseStringNode(parentId, depth, path, registerPath);
      case "t":
        return this.parseLiteralNode(parentId, depth, path, registerPath, "true", "boolean", true);
      case "f":
        return this.parseLiteralNode(parentId, depth, path, registerPath, "false", "boolean", false);
      case "n":
        return this.parseLiteralNode(parentId, depth, path, registerPath, "null", "null", null);
      default:
        if (character === "-" || isDigit(character)) {
          return this.parseNumberNode(parentId, depth, path, registerPath);
        }
        throw new JsonParseError(
          "Expected a JSON value.",
          this.position,
          Math.min(this.text.length, this.position + 1)
        );
    }
  }
  parseObject(parentId, depth, path, registerPath) {
    const startOffset = this.position;
    this.position += 1;
    const nodeId = this.createNode({
      nodeId: this.allocateNodeId(),
      kind: "object",
      startOffset,
      endOffset: startOffset + 1,
      depth,
      path,
      foldable: true,
      folded: false,
      ...parentId !== void 0 ? { parentId } : {}
    });
    if (registerPath) {
      this.registerPath(path, nodeId);
    }
    this.skipWhitespace();
    if (this.consumeIf("}")) {
      this.updateNode(nodeId, { endOffset: this.position });
      return nodeId;
    }
    while (true) {
      this.skipWhitespace();
      const propertyNameToken = this.readStringToken("Expected a property name.");
      this.skipWhitespace();
      if (!this.consumeIf(":")) {
        throw new JsonParseError(
          "Expected ':' after property name.",
          this.position,
          Math.min(this.text.length, this.position + 1)
        );
      }
      const childPath = appendObjectPath(path, propertyNameToken.value);
      const propertyNodeId = this.createNode({
        nodeId: this.allocateNodeId(),
        kind: "property",
        startOffset: propertyNameToken.startOffset,
        endOffset: propertyNameToken.endOffset,
        depth: depth + 1,
        path: childPath,
        foldable: false,
        folded: false,
        propertyName: propertyNameToken.value,
        parentId: nodeId
      });
      this.skipWhitespace();
      const valueNodeId = this.parseValue(propertyNodeId, depth + 1, childPath, true);
      const valueNode = this.requireNode(valueNodeId);
      this.updateNode(propertyNodeId, {
        endOffset: valueNode.endOffset,
        firstChildId: valueNodeId
      });
      this.skipWhitespace();
      if (this.consumeIf("}")) {
        this.updateNode(nodeId, { endOffset: this.position });
        return nodeId;
      }
      if (!this.consumeIf(",")) {
        throw new JsonParseError(
          "Expected ',' or '}' after object property.",
          this.position,
          Math.min(this.text.length, this.position + 1)
        );
      }
    }
    throw new JsonParseError("Unterminated object.", this.position, this.position);
  }
  parseArray(parentId, depth, path, registerPath) {
    const startOffset = this.position;
    this.position += 1;
    const nodeId = this.createNode({
      nodeId: this.allocateNodeId(),
      kind: "array",
      startOffset,
      endOffset: startOffset + 1,
      depth,
      path,
      foldable: true,
      folded: false,
      ...parentId !== void 0 ? { parentId } : {}
    });
    if (registerPath) {
      this.registerPath(path, nodeId);
    }
    this.skipWhitespace();
    if (this.consumeIf("]")) {
      this.updateNode(nodeId, { endOffset: this.position });
      return nodeId;
    }
    let index = 0;
    while (this.position < this.text.length) {
      this.skipWhitespace();
      const childNodeId = this.parseValue(nodeId, depth + 1, `${path}[${index}]`, true);
      this.skipWhitespace();
      if (this.consumeIf("]")) {
        this.updateNode(nodeId, { endOffset: this.position });
        return nodeId;
      }
      if (!this.consumeIf(",")) {
        throw new JsonParseError(
          "Expected ',' or ']' after array item.",
          this.position,
          Math.min(this.text.length, this.position + 1)
        );
      }
      index += 1;
    }
    throw new JsonParseError("Unterminated array.", this.position, this.position);
  }
  parseStringNode(parentId, depth, path, registerPath) {
    const token = this.readStringToken("Expected a string value.");
    const nodeId = this.createNode({
      nodeId: this.allocateNodeId(),
      kind: "string",
      startOffset: token.startOffset,
      endOffset: token.endOffset,
      depth,
      path,
      foldable: false,
      folded: false,
      scalarValue: token.value,
      ...parentId !== void 0 ? { parentId } : {}
    });
    if (registerPath) {
      this.registerPath(path, nodeId);
    }
    return nodeId;
  }
  parseNumberNode(parentId, depth, path, registerPath) {
    const startOffset = this.position;
    if (this.text[this.position] === "-") {
      this.position += 1;
    }
    const integerStart = this.position;
    if (this.text[this.position] === "0") {
      this.position += 1;
    } else if (isDigitOneToNine(this.text[this.position])) {
      this.position += 1;
      while (isDigit(this.text[this.position])) {
        this.position += 1;
      }
    } else {
      throw new JsonParseError(
        "Expected a digit in number literal.",
        integerStart,
        Math.min(this.text.length, integerStart + 1)
      );
    }
    if (this.text[this.position] === ".") {
      this.position += 1;
      const fractionalStart = this.position;
      if (!isDigit(this.text[this.position])) {
        throw new JsonParseError(
          "Expected a digit after decimal point.",
          fractionalStart,
          Math.min(this.text.length, fractionalStart + 1)
        );
      }
      while (isDigit(this.text[this.position])) {
        this.position += 1;
      }
    }
    if (this.text[this.position] === "e" || this.text[this.position] === "E") {
      this.position += 1;
      if (this.text[this.position] === "+" || this.text[this.position] === "-") {
        this.position += 1;
      }
      const exponentStart = this.position;
      if (!isDigit(this.text[this.position])) {
        throw new JsonParseError(
          "Expected a digit in exponent.",
          exponentStart,
          Math.min(this.text.length, exponentStart + 1)
        );
      }
      while (isDigit(this.text[this.position])) {
        this.position += 1;
      }
    }
    const rawText = this.text.slice(startOffset, this.position);
    const nodeId = this.createNode({
      nodeId: this.allocateNodeId(),
      kind: "number",
      startOffset,
      endOffset: this.position,
      depth,
      path,
      foldable: false,
      folded: false,
      scalarValue: Number(rawText),
      ...parentId !== void 0 ? { parentId } : {}
    });
    if (registerPath) {
      this.registerPath(path, nodeId);
    }
    return nodeId;
  }
  parseLiteralNode(parentId, depth, path, registerPath, literalText, kind, scalarValue) {
    const startOffset = this.position;
    if (!this.text.startsWith(literalText, this.position)) {
      throw new JsonParseError(
        `Expected '${literalText}'.`,
        startOffset,
        Math.min(this.text.length, startOffset + literalText.length)
      );
    }
    this.position += literalText.length;
    const nodeId = this.createNode({
      nodeId: this.allocateNodeId(),
      kind,
      startOffset,
      endOffset: this.position,
      depth,
      path,
      foldable: false,
      folded: false,
      scalarValue,
      ...parentId !== void 0 ? { parentId } : {}
    });
    if (registerPath) {
      this.registerPath(path, nodeId);
    }
    return nodeId;
  }
  readStringToken(expectedMessage) {
    const startOffset = this.position;
    if (!this.consumeIf('"')) {
      throw new JsonParseError(
        expectedMessage,
        this.position,
        Math.min(this.text.length, this.position + 1)
      );
    }
    let value = "";
    while (this.position < this.text.length) {
      const character = this.text[this.position];
      if (character === '"') {
        this.position += 1;
        return {
          startOffset,
          endOffset: this.position,
          value
        };
      }
      if (character === "\\") {
        this.position += 1;
        if (this.position >= this.text.length) {
          throw new JsonParseError("Unterminated escape sequence in string literal.", this.position, this.position);
        }
        const escapeCharacter = this.text[this.position];
        this.position += 1;
        value += decodeEscape(escapeCharacter, this.readUnicodeEscape.bind(this));
        continue;
      }
      if (character.charCodeAt(0) < 32) {
        throw new JsonParseError(
          "String literals may not contain unescaped control characters.",
          this.position,
          Math.min(this.text.length, this.position + 1)
        );
      }
      value += character;
      this.position += 1;
    }
    throw new JsonParseError("Unterminated string literal.", startOffset, this.text.length);
  }
  readUnicodeEscape() {
    const startOffset = this.position;
    const rawCode = this.text.slice(this.position, this.position + 4);
    if (!/^[0-9a-fA-F]{4}$/.test(rawCode)) {
      throw new JsonParseError(
        "Expected four hexadecimal digits in unicode escape.",
        startOffset,
        Math.min(this.text.length, startOffset + 4)
      );
    }
    this.position += 4;
    return String.fromCharCode(Number.parseInt(rawCode, 16));
  }
  createNode(node) {
    this.nodesById[node.nodeId] = node;
    this.nodeOrder.push(node.nodeId);
    if (node.parentId !== void 0) {
      const parentNode = this.requireNode(node.parentId);
      if (parentNode.firstChildId === void 0) {
        this.updateNode(node.parentId, { firstChildId: node.nodeId });
      }
      const previousSiblingId = this.lastChildByParentId.get(node.parentId);
      if (previousSiblingId !== void 0) {
        this.updateNode(previousSiblingId, { nextSiblingId: node.nodeId });
      }
      this.lastChildByParentId.set(node.parentId, node.nodeId);
    }
    return node.nodeId;
  }
  updateNode(nodeId, update) {
    const existingNode = this.requireNode(nodeId);
    this.nodesById[nodeId] = {
      ...existingNode,
      ...update
    };
  }
  allocateNodeId() {
    const nodeId = `node-${this.nextNodeNumber}`;
    this.nextNodeNumber += 1;
    return nodeId;
  }
  requireNode(nodeId) {
    const node = this.nodesById[nodeId];
    if (node === void 0) {
      throw new Error(`Node '${nodeId}' is not available.`);
    }
    return node;
  }
  registerPath(path, nodeId) {
    const existingNodeIds = this.pathToNodeIds[path] ?? [];
    this.pathToNodeIds[path] = [...existingNodeIds, nodeId];
  }
  skipWhitespace() {
    while (this.position < this.text.length && isWhitespace(this.text[this.position])) {
      this.position += 1;
    }
  }
  consumeIf(expectedCharacter) {
    if (this.text[this.position] !== expectedCharacter) {
      return false;
    }
    this.position += 1;
    return true;
  }
};
function parseJsonDocument(text) {
  return new JsonStructuralParser(text).parseDocument();
}
function listChildNodeIds(document2, nodeId) {
  const node = document2.nodesById[nodeId];
  const childNodeIds = [];
  let currentChildId = node?.firstChildId;
  while (currentChildId !== void 0) {
    childNodeIds.push(currentChildId);
    currentChildId = document2.nodesById[currentChildId]?.nextSiblingId;
  }
  return childNodeIds;
}
function getDocumentNode(document2, nodeId) {
  return document2.nodesById[nodeId];
}
function findNodeIdByPath(document2, path) {
  const nodeIds = document2.pathToNodeIds[path];
  return nodeIds?.[nodeIds.length - 1];
}
function toggleFoldInDocument(document2, nodeId) {
  const node = document2.nodesById[nodeId];
  if (node === void 0 || !node.foldable) {
    return document2;
  }
  return updateDocumentNode(document2, nodeId, { folded: !node.folded });
}
function revealPathInDocument(document2, path) {
  const targetNodeId = findNodeIdByPath(document2, path);
  if (targetNodeId === void 0) {
    return { document: document2 };
  }
  let updatedDocument = document2;
  let currentNodeId = targetNodeId;
  while (currentNodeId !== void 0) {
    const currentNode = getDocumentNode(updatedDocument, currentNodeId);
    if (currentNode === void 0) {
      break;
    }
    if (currentNode.foldable && currentNode.folded) {
      updatedDocument = updateDocumentNode(updatedDocument, currentNodeId, { folded: false });
    }
    currentNodeId = currentNode.parentId;
  }
  return {
    document: updatedDocument,
    targetNodeId
  };
}
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
      diagnostics: [],
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
    const parseResult = parseJsonDocument(command.text);
    return this.updateSession(command.sessionId, (session) => ({
      ...session,
      contentType: command.contentType,
      documentId: command.documentId,
      lifecycleState: "document-loaded",
      text: command.text,
      diagnostics: parseResult.diagnostics,
      revealTargetNodeId: void 0,
      ...parseResult.document !== void 0 ? { document: parseResult.document } : { document: void 0 }
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
  toggleFold(command) {
    return this.updateSession(command.sessionId, (session) => ({
      ...session,
      revealTargetNodeId: void 0,
      ...session.document !== void 0 ? { document: toggleFoldInDocument(session.document, command.nodeId) } : {}
    }));
  }
  revealPath(command) {
    return this.updateSession(command.sessionId, (session) => {
      if (session.document === void 0) {
        return {
          ...session,
          revealTargetNodeId: void 0
        };
      }
      const revealResult = revealPathInDocument(session.document, command.path);
      return {
        ...session,
        document: revealResult.document,
        revealTargetNodeId: revealResult.targetNodeId
      };
    });
  }
  clearRevealTarget(sessionId) {
    return this.updateSession(sessionId, (session) => ({
      ...session,
      revealTargetNodeId: void 0
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
function appendObjectPath(parentPath, propertyName) {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/u.test(propertyName)) {
    return `${parentPath}.${propertyName}`;
  }
  return `${parentPath}[${JSON.stringify(propertyName)}]`;
}
function updateDocumentNode(document2, nodeId, update) {
  const existingNode = document2.nodesById[nodeId];
  if (existingNode === void 0) {
    return document2;
  }
  return {
    ...document2,
    nodesById: {
      ...document2.nodesById,
      [nodeId]: {
        ...existingNode,
        ...update
      }
    }
  };
}
function toDiagnostic(error, textLength) {
  if (error instanceof JsonParseError) {
    return {
      code: error.code,
      message: error.message,
      severity: "error",
      startOffset: clampOffset(error.startOffset, textLength),
      endOffset: clampOffset(Math.max(error.startOffset, error.endOffset), textLength)
    };
  }
  if (error instanceof Error) {
    return {
      code: "json-syntax-error",
      message: error.message,
      severity: "error",
      startOffset: 0,
      endOffset: 0
    };
  }
  return {
    code: "json-syntax-error",
    message: "Invalid JSON.",
    severity: "error",
    startOffset: 0,
    endOffset: 0
  };
}
function clampOffset(offset, textLength) {
  return Math.max(0, Math.min(textLength, offset));
}
function decodeEscape(escapeCharacter, readUnicodeEscape) {
  switch (escapeCharacter) {
    case '"':
      return '"';
    case "\\":
      return "\\";
    case "/":
      return "/";
    case "b":
      return "\b";
    case "f":
      return "\f";
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "	";
    case "u":
      return readUnicodeEscape();
    default:
      throw new JsonParseError("Invalid escape sequence in string literal.", 0, 0);
  }
}
function isWhitespace(character) {
  return character === " " || character === "\n" || character === "\r" || character === "	";
}
function isDigit(character) {
  return character !== void 0 && character >= "0" && character <= "9";
}
function isDigitOneToNine(character) {
  return character !== void 0 && character >= "1" && character <= "9";
}

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
    const session = this.sessionRegistry.loadTextDocument(command);
    this.render(command.sessionId);
    await this.emit({
      type: "diagnosticsChanged",
      sessionId: command.sessionId,
      diagnostics: session.diagnostics
    });
    if (session.document !== void 0) {
      await this.emit({
        type: "documentLoaded",
        sessionId: command.sessionId,
        documentId: command.documentId,
        nodeCount: session.document.nodeCount
      });
    }
  }
  async setViewport(command) {
    this.sessionRegistry.setViewport(command);
    this.render(command.sessionId);
  }
  async toggleFold(command) {
    this.sessionRegistry.toggleFold(command);
    this.render(command.sessionId);
  }
  async revealPath(command) {
    const session = this.sessionRegistry.revealPath(command);
    this.render(command.sessionId);
    if (session.revealTargetNodeId !== void 0) {
      this.scrollToNode(command.sessionId, session.revealTargetNodeId);
      this.sessionRegistry.clearRevealTarget(command.sessionId);
    }
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
    hostElement.replaceChildren(createRuntimeView(session, (nodeId) => {
      void this.toggleFold({ nodeId, sessionId });
    }));
  }
  scrollToNode(sessionId, nodeId) {
    const hostElement = this.hostElements.get(sessionId);
    const targetElement = hostElement?.querySelector(`[data-node-id="${escapeSelectorValue(nodeId)}"]`);
    targetElement?.scrollIntoView({ block: "nearest" });
  }
  async emit(event) {
    const callback = this.hostCallbacks.get(event.sessionId);
    if (callback === void 0) {
      return;
    }
    await callback(event);
  }
};
function escapeSelectorValue(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}
function createRuntimeView(session, toggleFold2) {
  const container = document.createElement("section");
  container.className = "bjv-runtime";
  container.append(createStyles());
  if (session.document === void 0) {
    if (session.text === void 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "bjv-empty-state";
      emptyState.textContent = "Load a JSON document to begin rendering.";
      container.append(emptyState);
      return container;
    }
    container.append(createDiagnosticsPanel(session.diagnostics));
    return container;
  }
  if (session.diagnostics.length > 0) {
    container.append(createDiagnosticsPanel(session.diagnostics));
  }
  const documentContainer = document.createElement("div");
  documentContainer.className = "bjv-document";
  appendValueLines(documentContainer, session.document, session.document.rootNodeId, 0, false, void 0, toggleFold2);
  container.append(documentContainer);
  return container;
}
function appendValueLines(container, document2, nodeId, indentLevel, trailingComma, propertyName, toggleFold2) {
  const node = document2.nodesById[nodeId];
  switch (node.kind) {
    case "object":
      appendFoldableLines(container, document2, node, indentLevel, trailingComma, propertyName, "{", "}", toggleFold2);
      return;
    case "array":
      appendFoldableLines(container, document2, node, indentLevel, trailingComma, propertyName, "[", "]", toggleFold2);
      return;
    case "string":
      container.append(createScalarLine(node, indentLevel, trailingComma, propertyName, JSON.stringify(node.scalarValue), "string"));
      return;
    case "number":
      container.append(createScalarLine(node, indentLevel, trailingComma, propertyName, String(node.scalarValue), "number"));
      return;
    case "boolean":
      container.append(createScalarLine(node, indentLevel, trailingComma, propertyName, String(node.scalarValue), "boolean"));
      return;
    case "null":
      container.append(createScalarLine(node, indentLevel, trailingComma, propertyName, "null", "null"));
      return;
    case "property":
      return;
  }
}
function appendFoldableLines(container, document2, node, indentLevel, trailingComma, propertyName, openCharacter, closeCharacter, toggleFold2) {
  const childNodeIds = listChildNodeIds(document2, node.nodeId);
  const openingLine = createLine(node.nodeId, indentLevel);
  openingLine.append(createFoldButton(node, toggleFold2));
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
      const propertyNode = document2.nodesById[propertyNodeId];
      const valueNodeId = propertyNode.firstChildId;
      if (valueNodeId === void 0) {
        console.warn(`Property node ${propertyNode.nodeId} is missing its value node.`);
        return;
      }
      appendValueLines(
        container,
        document2,
        valueNodeId,
        indentLevel + 1,
        index < childNodeIds.length - 1,
        propertyNode.propertyName,
        toggleFold2
      );
    });
  } else {
    childNodeIds.forEach((childNodeId, index) => {
      appendValueLines(container, document2, childNodeId, indentLevel + 1, index < childNodeIds.length - 1, void 0, toggleFold2);
    });
  }
  const closingLine = createLine(void 0, indentLevel);
  closingLine.append(createFoldSpacer());
  closingLine.append(createTokenSpan("punctuation", closeCharacter));
  appendTrailingComma(closingLine, trailingComma);
  container.append(closingLine);
}
function createScalarLine(node, indentLevel, trailingComma, propertyName, valueText, tokenKind) {
  const line = createLine(node.nodeId, indentLevel);
  line.append(createFoldSpacer());
  appendPropertyName(line, propertyName);
  line.append(createTokenSpan(tokenKind, valueText));
  appendTrailingComma(line, trailingComma);
  return line;
}
function createLine(nodeId, indentLevel) {
  const line = document.createElement("div");
  line.className = "bjv-line";
  line.style.paddingLeft = `${indentLevel * 1.5}rem`;
  if (nodeId !== void 0) {
    line.dataset.nodeId = nodeId;
  }
  return line;
}
function createFoldButton(node, toggleFold2) {
  const button = document.createElement("button");
  button.className = "bjv-fold-button";
  button.type = "button";
  button.textContent = node.folded ? "\u25B8" : "\u25BE";
  button.title = node.folded ? "Expand" : "Collapse";
  button.addEventListener("click", () => toggleFold2(node.nodeId));
  return button;
}
function createFoldSpacer() {
  const spacer = document.createElement("span");
  spacer.className = "bjv-fold-spacer";
  spacer.textContent = " ";
  return spacer;
}
function appendPropertyName(line, propertyName) {
  if (propertyName === void 0) {
    return;
  }
  line.append(createTokenSpan("property", JSON.stringify(propertyName)));
  line.append(createTokenSpan("punctuation", ": "));
}
function appendTrailingComma(line, trailingComma) {
  if (!trailingComma) {
    return;
  }
  line.append(createTokenSpan("punctuation", ","));
}
function createTokenSpan(tokenKind, text) {
  const span = document.createElement("span");
  span.className = `bjv-token bjv-token-${tokenKind}`;
  span.textContent = text;
  return span;
}
function createCollapsedSpan() {
  const span = document.createElement("span");
  span.className = "bjv-token bjv-token-collapsed";
  span.textContent = "\u2026";
  return span;
}
function createDiagnosticsPanel(diagnostics) {
  const panel = document.createElement("section");
  panel.className = "bjv-diagnostics";
  const heading = document.createElement("h2");
  heading.className = "bjv-diagnostics-title";
  heading.textContent = diagnostics.length === 0 ? "No diagnostics" : "Diagnostics";
  panel.append(heading);
  if (diagnostics.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "bjv-diagnostics-empty";
    emptyText.textContent = "No runtime diagnostics.";
    panel.append(emptyText);
    return panel;
  }
  const list = document.createElement("ul");
  list.className = "bjv-diagnostics-list";
  for (const diagnostic of diagnostics) {
    const item = document.createElement("li");
    item.className = "bjv-diagnostics-item";
    item.textContent = `${diagnostic.message} (${diagnostic.startOffset}-${diagnostic.endOffset})`;
    list.append(item);
  }
  panel.append(list);
  return panel;
}
function createStyles() {
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
async function toggleFold(command) {
  await domRuntimeController.toggleFold(command);
}
async function revealPath(command) {
  await domRuntimeController.revealPath(command);
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
  setViewport,
  toggleFold,
  revealPath
};
if (typeof window !== "undefined") {
  window.BlazorJsonVisualizerRuntime = runtimeBlazorModule;
}
export {
  createSession,
  disposeSession,
  getRuntimeProtocolVersion,
  loadTextDocument,
  revealPath,
  setViewport,
  toggleFold
};
