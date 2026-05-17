// ../runtime-core/index.ts
var RUNTIME_PROTOCOL_VERSION = "0.6.0-milestone-006";
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
      this.parseValue(nodeId, depth + 1, `${path}[${index}]`, true);
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
      if (character === void 0) {
        break;
      }
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
      const characterCode = character.charCodeAt(0);
      if (characterCode < 32) {
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
      revision: 0,
      sessionId: command.sessionId,
      diagnostics: [],
      schemaDiagnostics: [],
      schemaMetadataByNodeId: {},
      projectionsById: {},
      tableProjectionsById: {},
      projectionSelectionsById: {},
      undoStack: [],
      redoStack: [],
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
      revision: 0,
      text: command.text,
      diagnostics: parseResult.diagnostics,
      schemaDiagnostics: [],
      schemaMetadataByNodeId: {},
      schemaAttachment: void 0,
      projectionsById: {},
      tableProjectionsById: {},
      projectionSelectionsById: {},
      revealTargetNodeId: void 0,
      undoStack: [],
      redoStack: [],
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
  applyTransaction(command) {
    const session = this.sessions.get(command.sessionId);
    if (session === void 0) {
      return rejectTransaction(command.sessionId, command.transaction.transactionId, `Session '${command.sessionId}' is not available.`);
    }
    if (command.transaction.sessionId !== command.sessionId) {
      return rejectTransaction(
        command.sessionId,
        command.transaction.transactionId,
        "Transaction sessionId must match the command sessionId."
      );
    }
    const result = this.executeTransaction(session, command.transaction);
    if (!result.accepted) {
      return result;
    }
    let updatedSession = {
      ...result.session,
      undoStack: [...session.undoStack, ...result.session.undoStack.slice(session.undoStack.length)],
      redoStack: [],
      schemaAttachment: void 0,
      schemaMetadataByNodeId: {},
      schemaDiagnostics: []
    };
    updatedSession = this.rebuildProjections(updatedSession);
    this.sessions.set(command.sessionId, updatedSession);
    return {
      accepted: true,
      session: updatedSession,
      patch: result.patch
    };
  }
  undo(command) {
    const session = this.sessions.get(command.sessionId);
    if (session === void 0) {
      return rejectTransaction(command.sessionId, createSyntheticTransactionId("undo", 0), `Session '${command.sessionId}' is not available.`);
    }
    const transactionId = createSyntheticTransactionId("undo", session.revision + 1);
    const historyEntry = session.undoStack[session.undoStack.length - 1];
    if (historyEntry === void 0) {
      return rejectTransaction(command.sessionId, transactionId, "Undo stack is empty.");
    }
    if (historyEntry.reverse === void 0) {
      return rejectTransaction(
        command.sessionId,
        transactionId,
        historyEntry.unsupportedUndoReason ?? "Undo is not supported for the latest transaction."
      );
    }
    const result = this.executeTransaction(session, {
      transactionId,
      sessionId: command.sessionId,
      baseRevision: session.revision,
      kind: historyEntry.reverse.kind,
      payload: historyEntry.reverse.payload
    });
    if (!result.accepted) {
      return result;
    }
    let updatedSession = {
      ...result.session,
      undoStack: session.undoStack.slice(0, -1),
      redoStack: [...session.redoStack, historyEntry],
      schemaAttachment: void 0,
      schemaMetadataByNodeId: {},
      schemaDiagnostics: []
    };
    updatedSession = this.rebuildProjections(updatedSession);
    this.sessions.set(command.sessionId, updatedSession);
    return {
      accepted: true,
      session: updatedSession,
      patch: result.patch
    };
  }
  redo(command) {
    const session = this.sessions.get(command.sessionId);
    if (session === void 0) {
      return rejectTransaction(command.sessionId, createSyntheticTransactionId("redo", 0), `Session '${command.sessionId}' is not available.`);
    }
    const transactionId = createSyntheticTransactionId("redo", session.revision + 1);
    const historyEntry = session.redoStack[session.redoStack.length - 1];
    if (historyEntry === void 0) {
      return rejectTransaction(command.sessionId, transactionId, "Redo stack is empty.");
    }
    const result = this.executeTransaction(session, {
      transactionId,
      sessionId: command.sessionId,
      baseRevision: session.revision,
      kind: historyEntry.forward.kind,
      payload: historyEntry.forward.payload
    });
    if (!result.accepted) {
      return result;
    }
    let updatedSession = {
      ...result.session,
      undoStack: [...session.undoStack, historyEntry],
      redoStack: session.redoStack.slice(0, -1),
      schemaAttachment: void 0,
      schemaMetadataByNodeId: {},
      schemaDiagnostics: []
    };
    updatedSession = this.rebuildProjections(updatedSession);
    this.sessions.set(command.sessionId, updatedSession);
    return {
      accepted: true,
      session: updatedSession,
      patch: result.patch
    };
  }
  attachSchema(command) {
    const session = this.requireSession(command.sessionId);
    if (session.document === void 0 || session.documentId === void 0 || session.text === void 0) {
      throw new Error(`Session '${command.sessionId}' does not have a loaded document.`);
    }
    const overlay = resolveSchemaOverlay(session.document, session.text, command.schema);
    let updatedSession = {
      ...session,
      schemaAttachment: {
        schemaId: command.schemaId,
        documentId: session.documentId,
        schema: command.schema
      },
      schemaMetadataByNodeId: overlay.metadataByNodeId,
      schemaDiagnostics: overlay.diagnostics
    };
    updatedSession = this.rebuildProjections(updatedSession);
    this.sessions.set(command.sessionId, updatedSession);
    return {
      session: updatedSession,
      affectedNodeIds: Object.keys(overlay.metadataByNodeId),
      diagnostics: overlay.diagnostics
    };
  }
  detachSchema(command) {
    const session = this.requireSession(command.sessionId);
    const previousNodeIds = Object.keys(session.schemaMetadataByNodeId);
    if (session.schemaAttachment === void 0 || session.schemaAttachment.schemaId !== command.schemaId) {
      return {
        session,
        affectedNodeIds: [],
        diagnostics: session.schemaDiagnostics
      };
    }
    let updatedSession = {
      ...session,
      schemaAttachment: void 0,
      schemaMetadataByNodeId: {},
      schemaDiagnostics: []
    };
    updatedSession = this.rebuildProjections(updatedSession);
    this.sessions.set(command.sessionId, updatedSession);
    return {
      session: updatedSession,
      affectedNodeIds: previousNodeIds,
      diagnostics: []
    };
  }
  getSchemaMetadataForPath(command) {
    const session = this.requireSession(command.sessionId);
    const document2 = session.document;
    if (document2 === void 0) {
      return void 0;
    }
    const nodeId = findNodeIdByPath(document2, command.path);
    if (nodeId === void 0) {
      return void 0;
    }
    return session.schemaMetadataByNodeId[nodeId];
  }
  createProjection(command) {
    const session = this.requireSession(command.sessionId);
    if (session.projectionsById[command.projectionId] !== void 0) {
      throw new Error(`Projection '${command.projectionId}' already exists.`);
    }
    const projection = buildProjection(session, command);
    const updatedSession = {
      ...session,
      projectionsById: {
        ...session.projectionsById,
        [command.projectionId]: projection.projection
      },
      tableProjectionsById: {
        ...session.tableProjectionsById,
        [command.projectionId]: projection.table
      }
    };
    this.sessions.set(command.sessionId, updatedSession);
    return {
      session: updatedSession,
      projection: projection.projection
    };
  }
  disposeProjection(command) {
    const session = this.requireSession(command.sessionId);
    if (session.projectionsById[command.projectionId] === void 0) {
      return { session };
    }
    const { [command.projectionId]: _, ...remainingProjections } = session.projectionsById;
    const { [command.projectionId]: __, ...remainingTables } = session.tableProjectionsById;
    const { [command.projectionId]: ___, ...remainingSelections } = session.projectionSelectionsById;
    const updatedSession = {
      ...session,
      projectionsById: remainingProjections,
      tableProjectionsById: remainingTables,
      projectionSelectionsById: remainingSelections
    };
    this.sessions.set(command.sessionId, updatedSession);
    return { session: updatedSession };
  }
  selectProjectionItem(command) {
    const session = this.requireSession(command.sessionId);
    const projection = session.projectionsById[command.projectionId];
    if (projection === void 0) {
      throw new Error(`Projection '${command.projectionId}' is not available.`);
    }
    const selectionSource = resolveProjectionSelectionSource(session, command.projectionId, command.selection);
    const updatedSession = {
      ...session,
      projectionSelectionsById: {
        ...session.projectionSelectionsById,
        [command.projectionId]: command.selection
      }
    };
    this.sessions.set(command.sessionId, updatedSession);
    return {
      session: updatedSession,
      projectionId: projection.projectionId,
      sourceNodeId: selectionSource.sourceNodeId,
      sourcePath: selectionSource.sourcePath
    };
  }
  editProjectionCell(command) {
    const session = this.requireSession(command.sessionId);
    const tableProjection = session.tableProjectionsById[command.projectionId];
    if (tableProjection === void 0) {
      return rejectTransaction(command.sessionId, `projection-edit-${session.revision + 1}`, `Projection '${command.projectionId}' is not available.`);
    }
    const row = tableProjection.rows.find((entry) => entry.rowId === command.rowId);
    if (row === void 0) {
      return rejectTransaction(command.sessionId, `projection-edit-${session.revision + 1}`, `Row '${command.rowId}' is not available.`);
    }
    const cell = row.cells.find((entry) => entry.columnId === command.columnId);
    if (cell === void 0) {
      return rejectTransaction(command.sessionId, `projection-edit-${session.revision + 1}`, `Column '${command.columnId}' is not available for row '${command.rowId}'.`);
    }
    return this.applyTransaction({
      sessionId: command.sessionId,
      transaction: {
        transactionId: `projection-edit-${session.revision + 1}`,
        sessionId: command.sessionId,
        baseRevision: session.revision,
        kind: "setPropertyValue",
        payload: {
          objectNodeId: row.itemNodeId,
          propertyName: cell.propertyName,
          value: command.value
        }
      }
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
  executeTransaction(session, transaction) {
    if (session.document === void 0 || session.documentId === void 0 || session.text === void 0) {
      return rejectTransaction(session.sessionId, transaction.transactionId, "Session does not have a loaded document.");
    }
    if (transaction.baseRevision !== session.revision) {
      return rejectTransaction(
        session.sessionId,
        transaction.transactionId,
        `Transaction base revision ${transaction.baseRevision} does not match current revision ${session.revision}.`
      );
    }
    const currentRootValue = parseJsonText(session.text);
    if (currentRootValue === void 0) {
      return rejectTransaction(session.sessionId, transaction.transactionId, "Current document text is not valid JSON.");
    }
    const mutationResult = applyTransactionMutation(session.document, currentRootValue, transaction);
    if (!("nextRootValue" in mutationResult)) {
      return mutationResult;
    }
    const nextText = serializeJsonValue(mutationResult.nextRootValue);
    if (nextText === void 0) {
      return rejectTransaction(session.sessionId, transaction.transactionId, "Updated document is not representable as valid JSON.");
    }
    const parseResult = parseJsonDocument(nextText);
    if (parseResult.document === void 0) {
      return rejectTransaction(session.sessionId, transaction.transactionId, "Updated document could not be re-indexed.");
    }
    const updatedSession = {
      ...session,
      revision: session.revision + 1,
      text: nextText,
      document: preserveFoldState(session.document, parseResult.document),
      diagnostics: parseResult.diagnostics,
      revealTargetNodeId: void 0,
      undoStack: [...session.undoStack, mutationResult.historyEntry],
      redoStack: [...session.redoStack]
    };
    return {
      accepted: true,
      session: updatedSession,
      patch: {
        sessionId: session.sessionId,
        documentId: session.documentId,
        baseRevision: session.revision,
        newRevision: updatedSession.revision,
        transactionId: transaction.transactionId,
        operations: [mutationResult.operation]
      }
    };
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
  rebuildProjections(session) {
    const projectionEntries = Object.values(session.projectionsById);
    if (projectionEntries.length === 0) {
      return session;
    }
    const projectionsById = {};
    const tableProjectionsById = {};
    const projectionSelectionsById = {};
    for (const projection of projectionEntries) {
      try {
        const rebuilt = buildProjection(session, projection);
        projectionsById[projection.projectionId] = rebuilt.projection;
        tableProjectionsById[projection.projectionId] = rebuilt.table;
        const existingSelection = session.projectionSelectionsById[projection.projectionId];
        if (existingSelection !== void 0) {
          projectionSelectionsById[projection.projectionId] = existingSelection;
        }
      } catch {
        continue;
      }
    }
    return {
      ...session,
      projectionsById,
      tableProjectionsById,
      projectionSelectionsById
    };
  }
};
function buildProjection(session, command) {
  if (command.kind !== "table.arrayOfObjects") {
    throw new Error(`Projection kind '${command.kind}' is not supported.`);
  }
  if (session.document === void 0 || session.text === void 0) {
    throw new Error(`Session '${session.sessionId}' does not have a loaded document.`);
  }
  const tableProjection = buildTableArrayOfObjectsProjection(
    session.document,
    session.text,
    command.projectionId,
    command.sourcePath,
    session.schemaDiagnostics,
    session.schemaAttachment?.schema
  );
  return {
    projection: {
      projectionId: command.projectionId,
      sessionId: session.sessionId,
      kind: command.kind,
      sourcePath: command.sourcePath,
      capabilities: ["readRows", "selectRow", "selectCell", "editCell"]
    },
    table: tableProjection
  };
}
function buildTableArrayOfObjectsProjection(document2, text, projectionId, sourcePath, schemaDiagnostics, schema) {
  const sourceNodeId = findNodeIdByPath(document2, sourcePath);
  if (sourceNodeId === void 0) {
    throw new Error(`Projection source path '${sourcePath}' was not found.`);
  }
  const sourceNode = document2.nodesById[sourceNodeId];
  if (sourceNode === void 0 || sourceNode.kind !== "array") {
    throw new Error(`Projection source path '${sourcePath}' must resolve to an array node.`);
  }
  const rowNodeIds = listChildNodeIds(document2, sourceNode.nodeId);
  for (const rowNodeId of rowNodeIds) {
    const rowNode = document2.nodesById[rowNodeId];
    if (rowNode === void 0 || rowNode.kind !== "object") {
      throw new Error(`Projection source path '${sourcePath}' must contain only object items.`);
    }
  }
  const rootValue = parseJsonText(text);
  if (rootValue === void 0) {
    throw new Error("Projection source document is not valid JSON.");
  }
  const sourceValue = getJsonValueAtPath(rootValue, sourcePath);
  if (!isJsonArrayDto(sourceValue) || !sourceValue.every((entry) => isJsonObjectDto(entry))) {
    throw new Error(`Projection source path '${sourcePath}' must resolve to an array of objects.`);
  }
  const propertyNames = collectProjectionPropertyNames(document2, rowNodeIds);
  const columns = propertyNames.map(
    (propertyName, index) => createTableColumn(sourcePath, propertyName, index, schema)
  );
  const columnByPropertyName = new Map(columns.map((column) => [column.propertyName, column]));
  const rows = rowNodeIds.map((rowNodeId, index) => {
    const rowNode = document2.nodesById[rowNodeId];
    if (rowNode === void 0) {
      throw new Error(`Projection row node '${rowNodeId}' is not available.`);
    }
    return {
      rowId: `row-${index}`,
      itemNodeId: rowNode.nodeId,
      index,
      cells: propertyNames.map((propertyName) => {
        const column = columnByPropertyName.get(propertyName);
        if (column === void 0) {
          throw new Error(`Projection column '${propertyName}' is not available.`);
        }
        const cellPath = appendObjectPath(rowNode.path, propertyName);
        const valueNodeId = findNodeIdByPath(document2, cellPath);
        const cellDiagnostics = schemaDiagnostics.filter(
          (diagnostic) => diagnostic.path === cellPath || valueNodeId !== void 0 && diagnostic.nodeId === valueNodeId
        );
        const value = getJsonValueAtPath(rootValue, cellPath);
        return {
          columnId: column.columnId,
          propertyName,
          ...valueNodeId !== void 0 ? { valueNodeId } : {},
          value,
          ...cellDiagnostics.length > 0 ? { diagnostics: cellDiagnostics } : {}
        };
      })
    };
  });
  return {
    projectionId,
    sourcePath,
    columns,
    rows
  };
}
function collectProjectionPropertyNames(document2, rowNodeIds) {
  const names = [];
  const nameSet = /* @__PURE__ */ new Set();
  for (const rowNodeId of rowNodeIds) {
    for (const propertyNodeId of listChildNodeIds(document2, rowNodeId)) {
      const propertyNode = document2.nodesById[propertyNodeId];
      const propertyName = propertyNode?.propertyName;
      if (propertyNode === void 0 || propertyNode.kind !== "property" || propertyName === void 0 || nameSet.has(propertyName)) {
        continue;
      }
      nameSet.add(propertyName);
      names.push(propertyName);
    }
  }
  return names;
}
function createTableColumn(sourcePath, propertyName, index, schema) {
  const columnId = `column-${index}`;
  if (schema === void 0) {
    return {
      columnId,
      propertyName
    };
  }
  const schemaResult = resolveSchemaForPath(schema, appendObjectPath(`${sourcePath}[0]`, propertyName));
  const resolvedSchema = schemaResult.resolvedSchema;
  if (resolvedSchema === void 0) {
    return {
      columnId,
      propertyName
    };
  }
  const expectedType = parseSchemaType(resolvedSchema.type);
  return {
    columnId,
    propertyName,
    ...typeof resolvedSchema.title === "string" ? { title: resolvedSchema.title } : {},
    ...expectedType !== void 0 ? { expectedType } : {}
  };
}
function resolveProjectionSelectionSource(session, projectionId, selection) {
  const tableProjection = session.tableProjectionsById[projectionId];
  if (tableProjection === void 0) {
    throw new Error(`Projection '${projectionId}' is not available.`);
  }
  const row = tableProjection.rows.find((entry) => entry.rowId === selection.rowId);
  if (row === void 0) {
    throw new Error(`Projection row '${selection.rowId}' is not available.`);
  }
  if (selection.kind === "row") {
    return {
      sourceNodeId: row.itemNodeId,
      sourcePath: `${tableProjection.sourcePath}[${row.index}]`
    };
  }
  const cell = row.cells.find((entry) => entry.columnId === selection.columnId);
  if (cell === void 0) {
    throw new Error(`Projection column '${selection.columnId}' is not available for row '${selection.rowId}'.`);
  }
  return {
    sourceNodeId: cell.valueNodeId,
    sourcePath: appendObjectPath(`${tableProjection.sourcePath}[${row.index}]`, cell.propertyName)
  };
}
function appendObjectPath(parentPath, propertyName) {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/u.test(propertyName)) {
    return `${parentPath}.${propertyName}`;
  }
  return `${parentPath}[${JSON.stringify(propertyName)}]`;
}
function applyTransactionMutation(document2, rootValue, transaction) {
  switch (transaction.kind) {
    case "replaceValue":
      return applyReplaceValueTransaction(document2, rootValue, transaction);
    case "setPropertyValue":
      return applySetPropertyValueTransaction(document2, rootValue, transaction);
    case "removeProperty":
      return applyRemovePropertyTransaction(document2, rootValue, transaction);
    case "insertArrayItem":
      return applyInsertArrayItemTransaction(document2, rootValue, transaction);
    case "removeArrayItem":
      return applyRemoveArrayItemTransaction(document2, rootValue, transaction);
  }
}
function applyReplaceValueTransaction(document2, rootValue, transaction) {
  if (!isReplaceValuePayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "replaceValue payload is invalid.");
  }
  if (!isJsonScalarValue(transaction.payload.value)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "replaceValue requires a primitive JSON value.");
  }
  const node = document2.nodesById[transaction.payload.nodeId];
  if (node === void 0) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, `Target node '${transaction.payload.nodeId}' was not found.`);
  }
  if (!isPrimitiveNodeKind(node.kind)) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${node.nodeId}' must be a primitive value node, but was '${node.kind}'.`
    );
  }
  const previousValue = getJsonValueAtPath(rootValue, node.path);
  if (!isJsonScalarValue(previousValue)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, `Target path '${node.path}' did not resolve to a primitive value.`);
  }
  const nextRootValue = setJsonValueAtPath(rootValue, node.path, cloneJsonValue(transaction.payload.value));
  return {
    nextRootValue,
    operation: {
      kind: "replaceValue",
      path: node.path,
      value: cloneJsonValue(transaction.payload.value)
    },
    historyEntry: {
      forward: {
        kind: transaction.kind,
        payload: {
          nodeId: node.nodeId,
          value: cloneJsonValue(transaction.payload.value)
        }
      },
      reverse: {
        kind: "replaceValue",
        payload: {
          nodeId: node.nodeId,
          value: cloneJsonValue(previousValue)
        }
      }
    }
  };
}
function applySetPropertyValueTransaction(document2, rootValue, transaction) {
  if (!isSetPropertyValuePayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "setPropertyValue payload is invalid.");
  }
  if (!isJsonValueDto(transaction.payload.value)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "setPropertyValue requires a valid JSON value.");
  }
  const objectNode = document2.nodesById[transaction.payload.objectNodeId];
  if (objectNode === void 0) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${transaction.payload.objectNodeId}' was not found.`
    );
  }
  if (objectNode.kind !== "object") {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${objectNode.nodeId}' must be an object node, but was '${objectNode.kind}'.`
    );
  }
  const objectValue = getJsonValueAtPath(rootValue, objectNode.path);
  if (!isJsonObjectDto(objectValue)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, `Target path '${objectNode.path}' did not resolve to an object.`);
  }
  objectValue[transaction.payload.propertyName] = cloneJsonValue(transaction.payload.value);
  return {
    nextRootValue: rootValue,
    operation: {
      kind: "setPropertyValue",
      path: appendObjectPath(objectNode.path, transaction.payload.propertyName),
      value: cloneJsonValue(transaction.payload.value)
    },
    historyEntry: {
      forward: {
        kind: transaction.kind,
        payload: {
          objectNodeId: objectNode.nodeId,
          propertyName: transaction.payload.propertyName,
          value: cloneJsonValue(transaction.payload.value)
        }
      },
      unsupportedUndoReason: "Undo is only supported for replaceValue transactions in Milestone 004."
    }
  };
}
function applyRemovePropertyTransaction(document2, rootValue, transaction) {
  if (!isRemovePropertyPayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "removeProperty payload is invalid.");
  }
  const objectNode = document2.nodesById[transaction.payload.objectNodeId];
  if (objectNode === void 0) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${transaction.payload.objectNodeId}' was not found.`
    );
  }
  if (objectNode.kind !== "object") {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${objectNode.nodeId}' must be an object node, but was '${objectNode.kind}'.`
    );
  }
  const objectValue = getJsonValueAtPath(rootValue, objectNode.path);
  if (!isJsonObjectDto(objectValue)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, `Target path '${objectNode.path}' did not resolve to an object.`);
  }
  if (!(transaction.payload.propertyName in objectValue)) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Property '${transaction.payload.propertyName}' was not found on object path '${objectNode.path}'.`
    );
  }
  delete objectValue[transaction.payload.propertyName];
  return {
    nextRootValue: rootValue,
    operation: {
      kind: "removeProperty",
      path: appendObjectPath(objectNode.path, transaction.payload.propertyName)
    },
    historyEntry: {
      forward: {
        kind: transaction.kind,
        payload: {
          objectNodeId: objectNode.nodeId,
          propertyName: transaction.payload.propertyName
        }
      },
      unsupportedUndoReason: "Undo is only supported for replaceValue transactions in Milestone 004."
    }
  };
}
function applyInsertArrayItemTransaction(document2, rootValue, transaction) {
  if (!isInsertArrayItemPayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "insertArrayItem payload is invalid.");
  }
  if (!isJsonValueDto(transaction.payload.value)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "insertArrayItem requires a valid JSON value.");
  }
  const arrayNode = document2.nodesById[transaction.payload.arrayNodeId];
  if (arrayNode === void 0) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, `Target node '${transaction.payload.arrayNodeId}' was not found.`);
  }
  if (arrayNode.kind !== "array") {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${arrayNode.nodeId}' must be an array node, but was '${arrayNode.kind}'.`
    );
  }
  const arrayValue = getJsonValueAtPath(rootValue, arrayNode.path);
  if (!isJsonArrayDto(arrayValue)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, `Target path '${arrayNode.path}' did not resolve to an array.`);
  }
  if (!Number.isInteger(transaction.payload.index) || transaction.payload.index < 0 || transaction.payload.index > arrayValue.length) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Array insertion index ${transaction.payload.index} is out of range for path '${arrayNode.path}'.`
    );
  }
  arrayValue.splice(transaction.payload.index, 0, cloneJsonValue(transaction.payload.value));
  return {
    nextRootValue: rootValue,
    operation: {
      kind: "insertArrayItem",
      path: `${arrayNode.path}[${transaction.payload.index}]`,
      value: cloneJsonValue(transaction.payload.value)
    },
    historyEntry: {
      forward: {
        kind: transaction.kind,
        payload: {
          arrayNodeId: arrayNode.nodeId,
          index: transaction.payload.index,
          value: cloneJsonValue(transaction.payload.value)
        }
      },
      unsupportedUndoReason: "Undo is only supported for replaceValue transactions in Milestone 004."
    }
  };
}
function applyRemoveArrayItemTransaction(document2, rootValue, transaction) {
  if (!isRemoveArrayItemPayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "removeArrayItem payload is invalid.");
  }
  const arrayNode = document2.nodesById[transaction.payload.arrayNodeId];
  if (arrayNode === void 0) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, `Target node '${transaction.payload.arrayNodeId}' was not found.`);
  }
  if (arrayNode.kind !== "array") {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${arrayNode.nodeId}' must be an array node, but was '${arrayNode.kind}'.`
    );
  }
  const arrayValue = getJsonValueAtPath(rootValue, arrayNode.path);
  if (!isJsonArrayDto(arrayValue)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, `Target path '${arrayNode.path}' did not resolve to an array.`);
  }
  if (!Number.isInteger(transaction.payload.index) || transaction.payload.index < 0 || transaction.payload.index >= arrayValue.length) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Array removal index ${transaction.payload.index} is out of range for path '${arrayNode.path}'.`
    );
  }
  arrayValue.splice(transaction.payload.index, 1);
  return {
    nextRootValue: rootValue,
    operation: {
      kind: "removeArrayItem",
      path: `${arrayNode.path}[${transaction.payload.index}]`
    },
    historyEntry: {
      forward: {
        kind: transaction.kind,
        payload: {
          arrayNodeId: arrayNode.nodeId,
          index: transaction.payload.index
        }
      },
      unsupportedUndoReason: "Undo is only supported for replaceValue transactions in Milestone 004."
    }
  };
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
function preserveFoldState(previousDocument, nextDocument) {
  let updatedDocument = nextDocument;
  for (const nodeId of previousDocument.nodeOrder) {
    const node = previousDocument.nodesById[nodeId];
    if (node === void 0 || !node.foldable || !node.folded) {
      continue;
    }
    const nextNodeId = findNodeIdByPath(updatedDocument, node.path);
    if (nextNodeId === void 0) {
      continue;
    }
    updatedDocument = updateDocumentNode(updatedDocument, nextNodeId, { folded: true });
  }
  return updatedDocument;
}
function rejectTransaction(sessionId, transactionId, reason) {
  return {
    accepted: false,
    sessionId,
    transactionId,
    reason
  };
}
function createSyntheticTransactionId(prefix, revision) {
  return `${prefix}-${revision}`;
}
function parseJsonText(text) {
  try {
    const parsed = JSON.parse(text);
    return isJsonValueDto(parsed) ? parsed : void 0;
  } catch {
    return void 0;
  }
}
function serializeJsonValue(value) {
  if (!isJsonValueDto(value)) {
    return void 0;
  }
  return JSON.stringify(value, void 0, 2);
}
function getJsonValueAtPath(rootValue, path) {
  const segments = parseStructuralPath(path);
  let currentValue = rootValue;
  for (const segment of segments) {
    if (typeof segment === "number") {
      if (!isJsonArrayDto(currentValue)) {
        return void 0;
      }
      currentValue = currentValue[segment];
      continue;
    }
    if (!isJsonObjectDto(currentValue)) {
      return void 0;
    }
    currentValue = currentValue[segment];
  }
  return currentValue;
}
function setJsonValueAtPath(rootValue, path, nextValue) {
  const segments = parseStructuralPath(path);
  if (segments.length === 0) {
    return cloneJsonValue(nextValue);
  }
  const parentValue = getJsonValueAtPath(rootValue, formatStructuralPath(segments.slice(0, -1)));
  const lastSegment = segments[segments.length - 1];
  if (lastSegment === void 0) {
    return cloneJsonValue(nextValue);
  }
  if (typeof lastSegment === "number") {
    if (!isJsonArrayDto(parentValue)) {
      throw new Error(`Path '${path}' does not resolve to an array item parent.`);
    }
    parentValue[lastSegment] = cloneJsonValue(nextValue);
    return rootValue;
  }
  if (!isJsonObjectDto(parentValue)) {
    throw new Error(`Path '${path}' does not resolve to an object property parent.`);
  }
  parentValue[lastSegment] = cloneJsonValue(nextValue);
  return rootValue;
}
function parseStructuralPath(path) {
  if (path === "$") {
    return [];
  }
  if (!path.startsWith("$")) {
    throw new Error(`Unsupported structural path '${path}'.`);
  }
  const segments = [];
  let index = 1;
  while (index < path.length) {
    const character = path[index];
    if (character === ".") {
      index += 1;
      const start = index;
      while (index < path.length && isIdentifierPathCharacter(path[index])) {
        index += 1;
      }
      if (start === index) {
        throw new Error(`Unsupported structural path '${path}'.`);
      }
      segments.push(path.slice(start, index));
      continue;
    }
    if (character === "[") {
      const closingIndex = findBracketEnd(path, index);
      const rawSegment = path.slice(index + 1, closingIndex);
      if (/^\d+$/u.test(rawSegment)) {
        segments.push(Number(rawSegment));
      } else {
        segments.push(JSON.parse(rawSegment));
      }
      index = closingIndex + 1;
      continue;
    }
    throw new Error(`Unsupported structural path '${path}'.`);
  }
  return segments;
}
function formatStructuralPath(segments) {
  let path = "$";
  for (const segment of segments) {
    if (typeof segment === "number") {
      path += `[${segment}]`;
      continue;
    }
    path = appendObjectPath(path, segment);
  }
  return path;
}
function findBracketEnd(path, startIndex) {
  let index = startIndex + 1;
  let inString = false;
  let escaped = false;
  while (index < path.length) {
    const character = path[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      index += 1;
      continue;
    }
    if (character === '"') {
      inString = true;
      index += 1;
      continue;
    }
    if (character === "]") {
      return index;
    }
    index += 1;
  }
  throw new Error(`Unsupported structural path '${path}'.`);
}
function cloneJsonValue(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}
function isPrimitiveNodeKind(kind) {
  return kind === "string" || kind === "number" || kind === "boolean" || kind === "null";
}
function isJsonScalarValue(value) {
  return value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value);
}
function isJsonArrayDto(value) {
  return Array.isArray(value) && value.every((item) => isJsonValueDto(item));
}
function isJsonObjectDto(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every((item) => isJsonValueDto(item));
}
function isJsonValueDto(value) {
  return isJsonScalarValue(value) || isJsonArrayDto(value) || isJsonObjectDto(value);
}
function resolveSchemaOverlay(document2, text, schema) {
  const metadataByNodeId = {};
  const diagnostics = [];
  const rootValue = parseJsonText(text);
  if (rootValue === void 0) {
    return { metadataByNodeId, diagnostics };
  }
  for (const nodeId of document2.nodeOrder) {
    const node = document2.nodesById[nodeId];
    if (node === void 0 || node.kind === "property") {
      continue;
    }
    const resolution = resolveSchemaForPath(schema, node.path);
    if (resolution.resolvedSchema === void 0) {
      continue;
    }
    const nodeValue = getJsonValueAtPath(rootValue, node.path);
    if (nodeValue === void 0) {
      continue;
    }
    const metadata = createSchemaNodeMetadata(nodeId, resolution.schemaPath, resolution.resolvedSchema, resolution.required);
    metadataByNodeId[nodeId] = metadata;
    collectSchemaDiagnostics(diagnostics, node, nodeValue, metadata, resolution.resolvedSchema);
  }
  return {
    metadataByNodeId,
    diagnostics
  };
}
function createSchemaNodeMetadata(nodeId, schemaPath, schema, required) {
  const metadata = {
    nodeId,
    schemaPath
  };
  if (typeof schema.title === "string") {
    metadata.title = schema.title;
  }
  if (typeof schema.description === "string") {
    metadata.description = schema.description;
  }
  const expectedType = parseSchemaType(schema.type);
  if (expectedType !== void 0) {
    metadata.expectedType = expectedType;
  }
  if (Array.isArray(schema.enum) && schema.enum.every((value) => isJsonValueDto(value))) {
    metadata.enumValues = schema.enum.map((value) => cloneJsonValue(value));
  }
  if (required) {
    metadata.required = true;
  }
  if (schema.default !== void 0 && isJsonValueDto(schema.default)) {
    metadata.defaultValue = cloneJsonValue(schema.default);
  }
  return metadata;
}
function collectSchemaDiagnostics(diagnostics, node, nodeValue, metadata, schema) {
  const typeExpectation = getPrimitiveTypeExpectation(metadata.expectedType);
  if (typeExpectation !== void 0) {
    const actualType = getSchemaTypeForValue(nodeValue);
    if (isPrimitiveSchemaType(actualType) && !typeExpectation.allowedTypes.some((expected) => matchesPrimitiveSchemaType(expected, actualType))) {
      diagnostics.push({
        diagnosticId: createSchemaDiagnosticId(node.nodeId, "type-mismatch"),
        nodeId: node.nodeId,
        path: node.path,
        severity: "error",
        message: `Expected type ${formatExpectedType(typeExpectation.expectedType)} but found '${actualType}'.`,
        source: "schema"
      });
    }
  }
  if (Array.isArray(metadata.enumValues) && !metadata.enumValues.some((value) => areJsonValuesEqual(value, nodeValue))) {
    diagnostics.push({
      diagnosticId: createSchemaDiagnosticId(node.nodeId, "enum-mismatch"),
      nodeId: node.nodeId,
      path: node.path,
      severity: "error",
      message: "Value is not in the allowed enum set.",
      source: "schema"
    });
  }
  const requiredNames = parseRequiredProperties(schema.required);
  if (requiredNames.length === 0 || !isJsonObjectDto(nodeValue) || node.kind !== "object") {
    return;
  }
  for (const propertyName of requiredNames) {
    if (Object.prototype.hasOwnProperty.call(nodeValue, propertyName)) {
      continue;
    }
    const missingPath = appendObjectPath(node.path, propertyName);
    diagnostics.push({
      diagnosticId: createSchemaDiagnosticId(node.nodeId, `missing-required-${propertyName}`),
      nodeId: node.nodeId,
      path: missingPath,
      severity: "error",
      message: `Missing required property '${propertyName}'.`,
      source: "schema"
    });
  }
}
function resolveSchemaForPath(rootSchema, path) {
  if (!isJsonObjectDto(rootSchema)) {
    return { resolvedSchema: void 0, schemaPath: "#", required: false };
  }
  let currentSchema = rootSchema;
  let schemaPath = "#";
  let required = false;
  const segments = parseStructuralPath(path);
  for (const segment of segments) {
    if (currentSchema === void 0) {
      break;
    }
    if (typeof segment === "number") {
      const itemsCandidate = currentSchema["items"];
      if (!isJsonObjectDto(itemsCandidate)) {
        currentSchema = void 0;
        break;
      }
      currentSchema = itemsCandidate;
      schemaPath += "/items";
      required = false;
      continue;
    }
    const propertiesCandidate = currentSchema["properties"];
    const propertySchema = isJsonObjectDto(propertiesCandidate) ? propertiesCandidate[segment] : void 0;
    if (!isJsonObjectDto(propertySchema)) {
      currentSchema = void 0;
      break;
    }
    required = parseRequiredProperties(currentSchema.required).includes(segment);
    currentSchema = propertySchema;
    schemaPath += `/properties/${escapeJsonPointerSegment(segment)}`;
  }
  return {
    resolvedSchema: currentSchema,
    schemaPath,
    required
  };
}
function parseSchemaType(value) {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return [...value];
  }
  return void 0;
}
function parseRequiredProperties(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry) => typeof entry === "string");
}
function getPrimitiveTypeExpectation(expectedType) {
  if (expectedType === void 0) {
    return void 0;
  }
  const allowedTypes = (Array.isArray(expectedType) ? expectedType : [expectedType]).filter(isPrimitiveSchemaType);
  if (allowedTypes.length === 0) {
    return void 0;
  }
  return {
    expectedType,
    allowedTypes
  };
}
function isPrimitiveSchemaType(value) {
  return value === "string" || value === "number" || value === "integer" || value === "boolean" || value === "null";
}
function matchesPrimitiveSchemaType(expected, actual) {
  if (expected === "number" && actual === "integer") {
    return true;
  }
  return expected === actual;
}
function getSchemaTypeForValue(value) {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  if (typeof value === "string") {
    return "string";
  }
  return "object";
}
function formatExpectedType(expectedType) {
  return Array.isArray(expectedType) ? expectedType.map((entry) => `'${entry}'`).join(" or ") : `'${expectedType}'`;
}
function areJsonValuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function createSchemaDiagnosticId(nodeId, suffix) {
  return `${nodeId}:${suffix}`;
}
function escapeJsonPointerSegment(segment) {
  return segment.replace(/~/gu, "~0").replace(/\//gu, "~1");
}
function isReplaceValuePayload(payload) {
  return "nodeId" in payload && "value" in payload;
}
function isSetPropertyValuePayload(payload) {
  return "objectNodeId" in payload && "propertyName" in payload && "value" in payload;
}
function isRemovePropertyPayload(payload) {
  return "objectNodeId" in payload && "propertyName" in payload && !("value" in payload);
}
function isInsertArrayItemPayload(payload) {
  return "arrayNodeId" in payload && "index" in payload && "value" in payload;
}
function isRemoveArrayItemPayload(payload) {
  return "arrayNodeId" in payload && "index" in payload && !("value" in payload);
}
function isIdentifierPathCharacter(character) {
  return character !== void 0 && /[A-Za-z0-9_]/u.test(character);
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
  async createProjection(command) {
    const result = this.sessionRegistry.createProjection(command);
    this.render(command.sessionId);
    await this.emit({
      type: "projectionCreated",
      sessionId: command.sessionId,
      projectionId: command.projectionId,
      kind: result.projection.kind
    });
    await this.emit({
      type: "projectionChanged",
      sessionId: command.sessionId,
      projectionId: command.projectionId
    });
  }
  async disposeProjection(command) {
    this.sessionRegistry.disposeProjection(command);
    this.render(command.sessionId);
    await this.emit({
      type: "projectionChanged",
      sessionId: command.sessionId,
      projectionId: command.projectionId
    });
  }
  async selectProjectionItem(command) {
    const result = this.sessionRegistry.selectProjectionItem(command);
    this.render(command.sessionId);
    await this.emit({
      type: "projectionSelectionChanged",
      sessionId: command.sessionId,
      projectionId: command.projectionId,
      sourceNodeId: result.sourceNodeId,
      sourcePath: result.sourcePath
    });
  }
  async attachSchema(command) {
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
  async detachSchema(command) {
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
  async getSchemaMetadataForPath(command) {
    return this.sessionRegistry.getSchemaMetadataForPath(command);
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
  async applyTransaction(command) {
    await this.handleTransactionResult(command.sessionId, this.sessionRegistry.applyTransaction(command));
  }
  async undo(command) {
    await this.handleTransactionResult(command.sessionId, this.sessionRegistry.undo(command));
  }
  async redo(command) {
    await this.handleTransactionResult(command.sessionId, this.sessionRegistry.redo(command));
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
    }, {
      selectProjectionItem: (projectionId, selection) => this.selectProjectionItem({ sessionId, projectionId, selection }),
      editProjectionCell: (command) => this.editProjectionCell({ ...command, sessionId })
    }));
  }
  scrollToNode(sessionId, nodeId) {
    const hostElement = this.hostElements.get(sessionId);
    const targetElement = [...hostElement?.querySelectorAll("[data-node-id]") ?? []].find(
      (element) => element.dataset.nodeId === nodeId
    );
    targetElement?.scrollIntoView({ block: "nearest" });
  }
  async emit(event) {
    const callback = this.hostCallbacks.get(event.sessionId);
    if (callback === void 0) {
      return;
    }
    await callback(event);
  }
  async handleTransactionResult(sessionId, result) {
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
    for (const projectionId of Object.keys(result.session.projectionsById)) {
      await this.emit({
        type: "projectionChanged",
        sessionId,
        projectionId
      });
    }
  }
  async editProjectionCell(command) {
    await this.handleTransactionResult(command.sessionId, this.sessionRegistry.editProjectionCell(command));
  }
};
function createRuntimeView(session, toggleFold2, projectionHandlers) {
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
    container.append(createDiagnosticsPanel("Parse diagnostics", session.diagnostics.map((diagnostic) => `${diagnostic.message} (${diagnostic.startOffset}-${diagnostic.endOffset})`)));
    return container;
  }
  if (session.diagnostics.length > 0) {
    container.append(createDiagnosticsPanel("Parse diagnostics", session.diagnostics.map((diagnostic) => `${diagnostic.message} (${diagnostic.startOffset}-${diagnostic.endOffset})`)));
  }
  if (session.schemaDiagnostics.length > 0) {
    container.append(createDiagnosticsPanel("Schema diagnostics", session.schemaDiagnostics.map((diagnostic) => `${diagnostic.message} (${diagnostic.path})`)));
  }
  for (const tableProjection of Object.values(session.tableProjectionsById)) {
    const selection = session.projectionSelectionsById[tableProjection.projectionId];
    container.append(createTableProjectionView(tableProjection, selection, projectionHandlers));
  }
  const documentContainer = document.createElement("div");
  documentContainer.className = "bjv-document";
  appendValueLines(
    documentContainer,
    session.document,
    session.document.rootNodeId,
    0,
    false,
    void 0,
    toggleFold2,
    session.schemaMetadataByNodeId,
    session.schemaDiagnostics
  );
  container.append(documentContainer);
  return container;
}
function appendValueLines(container, document2, nodeId, indentLevel, trailingComma, propertyName, toggleFold2, schemaMetadataByNodeId, schemaDiagnostics) {
  const node = document2.nodesById[nodeId];
  switch (node.kind) {
    case "object":
      appendFoldableLines(
        container,
        document2,
        node,
        indentLevel,
        trailingComma,
        propertyName,
        "{",
        "}",
        toggleFold2,
        schemaMetadataByNodeId,
        schemaDiagnostics
      );
      return;
    case "array":
      appendFoldableLines(
        container,
        document2,
        node,
        indentLevel,
        trailingComma,
        propertyName,
        "[",
        "]",
        toggleFold2,
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
function appendFoldableLines(container, document2, node, indentLevel, trailingComma, propertyName, openCharacter, closeCharacter, toggleFold2, schemaMetadataByNodeId, schemaDiagnostics) {
  const childNodeIds = listChildNodeIds(document2, node.nodeId);
  const openingLine = createLine(node.nodeId, indentLevel, schemaDiagnostics);
  applySchemaMetadata(openingLine, schemaMetadataByNodeId[node.nodeId], propertyName);
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
        console.warn(`Property node ${propertyNode.nodeId} (${propertyNode.propertyName ?? "unknown"}) is missing its value node.`);
        return;
      }
      appendValueLines(
        container,
        document2,
        valueNodeId,
        indentLevel + 1,
        index < childNodeIds.length - 1,
        propertyNode.propertyName,
        toggleFold2,
        schemaMetadataByNodeId,
        schemaDiagnostics
      );
    });
  } else {
    childNodeIds.forEach((childNodeId, index) => {
      appendValueLines(
        container,
        document2,
        childNodeId,
        indentLevel + 1,
        index < childNodeIds.length - 1,
        void 0,
        toggleFold2,
        schemaMetadataByNodeId,
        schemaDiagnostics
      );
    });
  }
  const closingLine = createLine(void 0, indentLevel, schemaDiagnostics);
  closingLine.append(createFoldSpacer());
  closingLine.append(createTokenSpan("punctuation", closeCharacter));
  appendTrailingComma(closingLine, trailingComma);
  container.append(closingLine);
}
function createScalarLine(node, indentLevel, trailingComma, propertyName, valueText, tokenKind, schemaMetadata, schemaDiagnostics) {
  const line = createLine(node.nodeId, indentLevel, schemaDiagnostics);
  applySchemaMetadata(line, schemaMetadata, propertyName);
  line.append(createFoldSpacer());
  appendPropertyName(line, propertyName);
  line.append(createTokenSpan(tokenKind, valueText));
  appendTrailingComma(line, trailingComma);
  return line;
}
function createLine(nodeId, indentLevel, schemaDiagnostics) {
  const line = document.createElement("div");
  line.className = "bjv-line";
  line.style.paddingLeft = `${indentLevel * 1.5}rem`;
  if (nodeId !== void 0) {
    line.dataset.nodeId = nodeId;
    if (schemaDiagnostics.some((diagnostic) => diagnostic.nodeId === nodeId)) {
      line.classList.add("bjv-line-schema-error");
      line.append(createSchemaDiagnosticMarker());
    }
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
function createSchemaDiagnosticMarker() {
  const marker = document.createElement("span");
  marker.className = "bjv-schema-marker";
  marker.textContent = "\u26A0 ";
  return marker;
}
function applySchemaMetadata(line, metadata, propertyName) {
  if (metadata === void 0) {
    return;
  }
  const hoverParts = [metadata.title, metadata.description].filter((part) => typeof part === "string" && part.length > 0);
  if (hoverParts.length > 0) {
    line.title = hoverParts.join(" \u2014 ");
  }
  if (propertyName !== void 0 && metadata.required) {
    const requiredToken = document.createElement("span");
    requiredToken.className = "bjv-schema-required";
    requiredToken.textContent = " *required";
    line.append(requiredToken);
  }
  if (Array.isArray(metadata.enumValues) && metadata.enumValues.length > 0) {
    const enumToken = document.createElement("span");
    enumToken.className = "bjv-schema-enum";
    enumToken.textContent = ` \u27EAenum: ${metadata.enumValues.map((value) => JSON.stringify(value)).join(", ")}\u27EB`;
    line.append(enumToken);
  }
}
function createTableProjectionView(projection, selection, handlers) {
  const container = document.createElement("section");
  container.className = "bjv-projection";
  const heading = document.createElement("h2");
  heading.className = "bjv-projection-title";
  heading.textContent = `Projection: ${projection.projectionId} (${projection.sourcePath})`;
  container.append(heading);
  if (projection.columns.length === 0) {
    const empty = document.createElement("p");
    empty.className = "bjv-projection-empty";
    empty.textContent = "No table columns were detected.";
    container.append(empty);
    return container;
  }
  const table = document.createElement("table");
  table.className = "bjv-projection-table";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const rowHeader = document.createElement("th");
  rowHeader.textContent = "#";
  headRow.append(rowHeader);
  for (const column of projection.columns) {
    const th = document.createElement("th");
    th.textContent = column.title ?? column.propertyName;
    if (column.expectedType !== void 0) {
      th.title = Array.isArray(column.expectedType) ? column.expectedType.join(" | ") : column.expectedType;
    }
    headRow.append(th);
  }
  thead.append(headRow);
  table.append(thead);
  const tbody = document.createElement("tbody");
  for (const row of projection.rows) {
    const tr = document.createElement("tr");
    if (selection?.kind === "row" && selection.rowId === row.rowId) {
      tr.classList.add("bjv-projection-row-selected");
    }
    tr.addEventListener("click", () => {
      void handlers.selectProjectionItem(projection.projectionId, {
        kind: "row",
        rowId: row.rowId
      });
    });
    const indexCell = document.createElement("td");
    indexCell.textContent = String(row.index);
    tr.append(indexCell);
    for (const cell of row.cells) {
      const td = document.createElement("td");
      const isSelectedCell = selection?.kind === "cell" && selection.rowId === row.rowId && selection.columnId === cell.columnId;
      if (isSelectedCell) {
        td.classList.add("bjv-projection-cell-selected");
      }
      td.textContent = cell.value === void 0 ? "\u2205" : JSON.stringify(cell.value);
      if (cell.diagnostics !== void 0 && cell.diagnostics.length > 0) {
        td.classList.add("bjv-projection-cell-error");
        td.title = cell.diagnostics.map((diagnostic) => diagnostic.message).join("\n");
      }
      td.addEventListener("click", (event) => {
        event.stopPropagation();
        void handlers.selectProjectionItem(projection.projectionId, {
          kind: "cell",
          rowId: row.rowId,
          columnId: cell.columnId
        });
      });
      td.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        const defaultValue = cell.value === void 0 ? "null" : JSON.stringify(cell.value);
        const nextText = window.prompt(`Edit ${cell.propertyName}`, defaultValue);
        if (nextText === null) {
          return;
        }
        let parsedValue;
        try {
          parsedValue = JSON.parse(nextText);
        } catch {
          window.alert("Cell edits must be valid JSON values.");
          return;
        }
        if (!isJsonValue(parsedValue)) {
          window.alert("Cell edits must be JSON scalar/object/array values.");
          return;
        }
        void handlers.editProjectionCell({
          projectionId: projection.projectionId,
          rowId: row.rowId,
          columnId: cell.columnId,
          value: parsedValue
        });
      });
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  container.append(table);
  return container;
}
function isJsonValue(value) {
  if (value === null) {
    return true;
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every((entry) => isJsonValue(entry));
  }
  if (typeof value === "object") {
    return Object.values(value).every((entry) => isJsonValue(entry));
  }
  return false;
}
function createDiagnosticsPanel(title, diagnostics) {
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

    .bjv-projection {
      margin-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.75rem;
      font-family: system-ui, sans-serif;
    }

    .bjv-projection-title {
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
    }

    .bjv-projection-empty {
      margin: 0;
      color: #64748b;
    }

    .bjv-projection-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      table-layout: fixed;
    }

    .bjv-projection-table th,
    .bjv-projection-table td {
      border: 1px solid #cbd5e1;
      padding: 0.25rem 0.4rem;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bjv-projection-table td {
      cursor: pointer;
    }

    .bjv-projection-row-selected {
      background: #e0f2fe;
    }

    .bjv-projection-cell-selected {
      outline: 2px solid #0284c7;
      outline-offset: -2px;
    }

    .bjv-projection-cell-error {
      background: #fef2f2;
      color: #991b1b;
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
async function createProjection(command) {
  await domRuntimeController.createProjection(command);
}
async function disposeProjection(command) {
  await domRuntimeController.disposeProjection(command);
}
async function selectProjectionItem(command) {
  await domRuntimeController.selectProjectionItem(command);
}
async function attachSchema(command) {
  await domRuntimeController.attachSchema(command);
}
async function detachSchema(command) {
  await domRuntimeController.detachSchema(command);
}
async function getSchemaMetadataForPath(command) {
  return domRuntimeController.getSchemaMetadataForPath(command);
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
async function applyTransaction(command) {
  await domRuntimeController.applyTransaction(command);
}
async function undo(command) {
  await domRuntimeController.undo(command);
}
async function redo(command) {
  await domRuntimeController.redo(command);
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
  createProjection,
  disposeProjection,
  selectProjectionItem,
  attachSchema,
  detachSchema,
  getSchemaMetadataForPath,
  setViewport,
  toggleFold,
  revealPath,
  applyTransaction,
  undo,
  redo
};
if (typeof window !== "undefined") {
  window.BlazorJsonVisualizerRuntime = runtimeBlazorModule;
}
export {
  applyTransaction,
  attachSchema,
  createProjection,
  createSession,
  detachSchema,
  disposeProjection,
  disposeSession,
  getRuntimeProtocolVersion,
  getSchemaMetadataForPath,
  loadTextDocument,
  redo,
  revealPath,
  selectProjectionItem,
  setViewport,
  toggleFold,
  undo
};
