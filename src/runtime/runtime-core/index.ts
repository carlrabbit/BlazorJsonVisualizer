export const RUNTIME_PROTOCOL_VERSION = "0.3.0-milestone-003";

export type JsonContentType = "application/json";
export type DocumentSessionLifecycleState = "created" | "mounted" | "document-loaded" | "disposed";
export type StructuralNodeKind = "object" | "array" | "property" | "string" | "number" | "boolean" | "null";
export type RuntimeDiagnosticSeverity = "error";
export type JsonScalarValue = string | number | boolean | null;

export interface RuntimeOptionsDto {
  placeholderText?: string | undefined;
}

export interface CreateSessionCommand {
  hostElementId: string;
  sessionId: string;
  options?: RuntimeOptionsDto | undefined;
}

export interface DisposeSessionCommand {
  sessionId: string;
}

export interface LoadTextDocumentCommand {
  sessionId: string;
  documentId: string;
  text: string;
  contentType: JsonContentType;
}

export interface SetViewportCommand {
  sessionId: string;
  width: number;
  height: number;
}

export interface ToggleFoldCommand {
  sessionId: string;
  nodeId: string;
}

export interface RevealPathCommand {
  sessionId: string;
  path: string;
}

export interface ViewportDto {
  width: number;
  height: number;
}

export interface RuntimeDiagnosticDto {
  code: string;
  message: string;
  severity: RuntimeDiagnosticSeverity;
  startOffset: number;
  endOffset: number;
}

export interface StructuralNodeRecord {
  nodeId: string;
  kind: StructuralNodeKind;
  startOffset: number;
  endOffset: number;
  parentId?: string | undefined;
  firstChildId?: string | undefined;
  nextSiblingId?: string | undefined;
  depth: number;
  path: string;
  foldable: boolean;
  folded: boolean;
  propertyName?: string | undefined;
  scalarValue?: JsonScalarValue | undefined;
}

export interface StructuralIndexDocument {
  rootNodeId: string;
  text: string;
  nodeCount: number;
  nodeOrder: string[];
  nodesById: Record<string, StructuralNodeRecord>;
  pathToNodeIds: Record<string, string[]>;
}

export interface DocumentSessionRecord {
  sessionId: string;
  hostElementId: string;
  lifecycleState: DocumentSessionLifecycleState;
  options?: RuntimeOptionsDto | undefined;
  documentId?: string | undefined;
  text?: string | undefined;
  contentType?: JsonContentType | undefined;
  viewport?: ViewportDto | undefined;
  document?: StructuralIndexDocument | undefined;
  diagnostics: RuntimeDiagnosticDto[];
  revealTargetNodeId?: string | undefined;
}

export interface SessionCreatedEventDto {
  type: "sessionCreated";
  sessionId: string;
}

export interface SessionDisposedEventDto {
  type: "sessionDisposed";
  sessionId: string;
}

export interface RuntimeErrorEventDto {
  type: "runtimeError";
  sessionId: string;
  message: string;
  recoverable: boolean;
}

export interface PlaceholderEventDto {
  type: "placeholderEvent";
  sessionId: string;
  message: string;
}

export interface DocumentLoadedEventDto {
  type: "documentLoaded";
  sessionId: string;
  documentId: string;
  nodeCount: number;
}

export interface DiagnosticsChangedEventDto {
  type: "diagnosticsChanged";
  sessionId: string;
  diagnostics: RuntimeDiagnosticDto[];
}

export type RuntimeEventDto =
  | SessionCreatedEventDto
  | SessionDisposedEventDto
  | RuntimeErrorEventDto
  | PlaceholderEventDto
  | DocumentLoadedEventDto
  | DiagnosticsChangedEventDto;

export interface ParseJsonDocumentResult {
  document?: StructuralIndexDocument | undefined;
  diagnostics: RuntimeDiagnosticDto[];
}

export interface RevealPathResult {
  document: StructuralIndexDocument;
  targetNodeId?: string | undefined;
}

class JsonParseError extends Error {
  public constructor(
    public readonly message: string,
    public readonly startOffset: number,
    public readonly endOffset: number,
    public readonly code: string = "json-syntax-error"
  ) {
    super(message);
    this.name = "JsonParseError";
  }
}

class JsonStructuralParser {
  private position = 0;
  private nextNodeNumber = 1;
  private readonly nodeOrder: string[] = [];
  private readonly nodesById: Record<string, StructuralNodeRecord> = {};
  private readonly pathToNodeIds: Record<string, string[]> = {};
  private readonly lastChildByParentId = new Map<string, string>();

  public constructor(private readonly text: string) {}

  public parseDocument(): ParseJsonDocumentResult {
    try {
      this.skipWhitespace();

      if (this.position >= this.text.length) {
        throw new JsonParseError("Expected a JSON value.", 0, 0);
      }

      const rootNodeId = this.parseValue(undefined, 0, "$", true);
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

  private parseValue(parentId: string | undefined, depth: number, path: string, registerPath: boolean): string {
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

  private parseObject(parentId: string | undefined, depth: number, path: string, registerPath: boolean): string {
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
      ...(parentId !== undefined ? { parentId } : {})
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

  private parseArray(parentId: string | undefined, depth: number, path: string, registerPath: boolean): string {
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
      ...(parentId !== undefined ? { parentId } : {})
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

  private parseStringNode(parentId: string | undefined, depth: number, path: string, registerPath: boolean): string {
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
      ...(parentId !== undefined ? { parentId } : {})
    });

    if (registerPath) {
      this.registerPath(path, nodeId);
    }

    return nodeId;
  }

  private parseNumberNode(parentId: string | undefined, depth: number, path: string, registerPath: boolean): string {
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
      ...(parentId !== undefined ? { parentId } : {})
    });

    if (registerPath) {
      this.registerPath(path, nodeId);
    }

    return nodeId;
  }

  private parseLiteralNode(
    parentId: string | undefined,
    depth: number,
    path: string,
    registerPath: boolean,
    literalText: string,
    kind: "boolean" | "null",
    scalarValue: JsonScalarValue
  ): string {
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
      ...(parentId !== undefined ? { parentId } : {})
    });

    if (registerPath) {
      this.registerPath(path, nodeId);
    }

    return nodeId;
  }

  private readStringToken(expectedMessage: string): { startOffset: number; endOffset: number; value: string } {
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

      if (character === undefined) {
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
      if (characterCode < 0x20) {
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

  private readUnicodeEscape(): string {
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

  private createNode(node: StructuralNodeRecord): string {
    this.nodesById[node.nodeId] = node;
    this.nodeOrder.push(node.nodeId);

    if (node.parentId !== undefined) {
      const parentNode = this.requireNode(node.parentId);

      if (parentNode.firstChildId === undefined) {
        this.updateNode(node.parentId, { firstChildId: node.nodeId });
      }

      const previousSiblingId = this.lastChildByParentId.get(node.parentId);
      if (previousSiblingId !== undefined) {
        this.updateNode(previousSiblingId, { nextSiblingId: node.nodeId });
      }

      this.lastChildByParentId.set(node.parentId, node.nodeId);
    }

    return node.nodeId;
  }

  private updateNode(nodeId: string, update: Partial<StructuralNodeRecord>): void {
    const existingNode = this.requireNode(nodeId);
    this.nodesById[nodeId] = {
      ...existingNode,
      ...update
    };
  }

  private allocateNodeId(): string {
    const nodeId = `node-${this.nextNodeNumber}`;
    this.nextNodeNumber += 1;
    return nodeId;
  }

  private requireNode(nodeId: string): StructuralNodeRecord {
    const node = this.nodesById[nodeId];

    if (node === undefined) {
      throw new Error(`Node '${nodeId}' is not available.`);
    }

    return node;
  }

  private registerPath(path: string, nodeId: string): void {
    const existingNodeIds = this.pathToNodeIds[path] ?? [];
    this.pathToNodeIds[path] = [...existingNodeIds, nodeId];
  }

  private skipWhitespace(): void {
    while (this.position < this.text.length && isWhitespace(this.text[this.position])) {
      this.position += 1;
    }
  }

  private consumeIf(expectedCharacter: string): boolean {
    if (this.text[this.position] !== expectedCharacter) {
      return false;
    }

    this.position += 1;
    return true;
  }
}

export function parseJsonDocument(text: string): ParseJsonDocumentResult {
  return new JsonStructuralParser(text).parseDocument();
}

export function listChildNodeIds(document: StructuralIndexDocument, nodeId: string): string[] {
  const node = document.nodesById[nodeId];
  const childNodeIds: string[] = [];
  let currentChildId = node?.firstChildId;

  while (currentChildId !== undefined) {
    childNodeIds.push(currentChildId);
    currentChildId = document.nodesById[currentChildId]?.nextSiblingId;
  }

  return childNodeIds;
}

function getDocumentNode(document: StructuralIndexDocument, nodeId: string): StructuralNodeRecord | undefined {
  return document.nodesById[nodeId];
}

export function findNodeIdByPath(document: StructuralIndexDocument, path: string): string | undefined {
  const nodeIds = document.pathToNodeIds[path];
  return nodeIds?.[nodeIds.length - 1];
}

export function toggleFoldInDocument(document: StructuralIndexDocument, nodeId: string): StructuralIndexDocument {
  const node = document.nodesById[nodeId];

  if (node === undefined || !node.foldable) {
    return document;
  }

  return updateDocumentNode(document, nodeId, { folded: !node.folded });
}

export function revealPathInDocument(document: StructuralIndexDocument, path: string): RevealPathResult {
  const targetNodeId = findNodeIdByPath(document, path);

  if (targetNodeId === undefined) {
    return { document };
  }

  let updatedDocument = document;
  let currentNodeId: string | undefined = targetNodeId;

  while (currentNodeId !== undefined) {
    const currentNode = getDocumentNode(updatedDocument, currentNodeId);

    if (currentNode === undefined) {
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

export class SessionRegistry {
  private readonly sessions = new Map<string, DocumentSessionRecord>();

  public createSession(command: CreateSessionCommand): DocumentSessionRecord {
    if (this.sessions.has(command.sessionId)) {
      throw new Error(`Session '${command.sessionId}' already exists.`);
    }

    const session: DocumentSessionRecord = {
      hostElementId: command.hostElementId,
      lifecycleState: "created",
      sessionId: command.sessionId,
      diagnostics: [],
      ...(command.options !== undefined ? { options: command.options } : {})
    };

    this.sessions.set(command.sessionId, session);
    return session;
  }

  public mountSession(sessionId: string): DocumentSessionRecord {
    return this.updateSession(sessionId, (session) => ({
      ...session,
      lifecycleState: "mounted"
    }));
  }

  public loadTextDocument(command: LoadTextDocumentCommand): DocumentSessionRecord {
    const parseResult = parseJsonDocument(command.text);

    return this.updateSession(command.sessionId, (session) => ({
      ...session,
      contentType: command.contentType,
      documentId: command.documentId,
      lifecycleState: "document-loaded",
      text: command.text,
      diagnostics: parseResult.diagnostics,
      revealTargetNodeId: undefined,
      ...(parseResult.document !== undefined ? { document: parseResult.document } : { document: undefined })
    }));
  }

  public setViewport(command: SetViewportCommand): DocumentSessionRecord {
    return this.updateSession(command.sessionId, (session) => ({
      ...session,
      viewport: {
        height: command.height,
        width: command.width
      }
    }));
  }

  public toggleFold(command: ToggleFoldCommand): DocumentSessionRecord {
    return this.updateSession(command.sessionId, (session) => ({
      ...session,
      revealTargetNodeId: undefined,
      ...(session.document !== undefined ? { document: toggleFoldInDocument(session.document, command.nodeId) } : {})
    }));
  }

  public revealPath(command: RevealPathCommand): DocumentSessionRecord {
    return this.updateSession(command.sessionId, (session) => {
      if (session.document === undefined) {
        return {
          ...session,
          revealTargetNodeId: undefined
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

  public clearRevealTarget(sessionId: string): DocumentSessionRecord {
    return this.updateSession(sessionId, (session) => ({
      ...session,
      revealTargetNodeId: undefined
    }));
  }

  public disposeSession(command: DisposeSessionCommand): DocumentSessionRecord {
    const session = this.requireSession(command.sessionId);
    const disposedSession: DocumentSessionRecord = {
      ...session,
      lifecycleState: "disposed"
    };

    this.sessions.delete(command.sessionId);
    return disposedSession;
  }

  public getSession(sessionId: string): DocumentSessionRecord | undefined {
    return this.sessions.get(sessionId);
  }

  public listSessionIds(): string[] {
    return [...this.sessions.keys()];
  }

  private updateSession(
    sessionId: string,
    update: (session: DocumentSessionRecord) => DocumentSessionRecord
  ): DocumentSessionRecord {
    const session = this.requireSession(sessionId);
    const updatedSession = update(session);

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  private requireSession(sessionId: string): DocumentSessionRecord {
    const session = this.sessions.get(sessionId);

    if (session === undefined) {
      throw new Error(`Session '${sessionId}' is not available.`);
    }

    if (session.lifecycleState === "disposed") {
      throw new Error(`Session '${sessionId}' has been disposed.`);
    }

    return session;
  }
}

function appendObjectPath(parentPath: string, propertyName: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/u.test(propertyName)) {
    return `${parentPath}.${propertyName}`;
  }

  return `${parentPath}[${JSON.stringify(propertyName)}]`;
}

function updateDocumentNode(
  document: StructuralIndexDocument,
  nodeId: string,
  update: Partial<StructuralNodeRecord>
): StructuralIndexDocument {
  const existingNode = document.nodesById[nodeId];

  if (existingNode === undefined) {
    return document;
  }

  return {
    ...document,
    nodesById: {
      ...document.nodesById,
      [nodeId]: {
        ...existingNode,
        ...update
      }
    }
  };
}

function toDiagnostic(error: unknown, textLength: number): RuntimeDiagnosticDto {
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

function clampOffset(offset: number, textLength: number): number {
  return Math.max(0, Math.min(textLength, offset));
}

function decodeEscape(escapeCharacter: string | undefined, readUnicodeEscape: () => string): string {
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
      return "\t";
    case "u":
      return readUnicodeEscape();
    default:
      throw new JsonParseError("Invalid escape sequence in string literal.", 0, 0);
  }
}

function isWhitespace(character: string | undefined): boolean {
  return character === " " || character === "\n" || character === "\r" || character === "\t";
}

function isDigit(character: string | undefined): boolean {
  return character !== undefined && character >= "0" && character <= "9";
}

function isDigitOneToNine(character: string | undefined): boolean {
  return character !== undefined && character >= "1" && character <= "9";
}
