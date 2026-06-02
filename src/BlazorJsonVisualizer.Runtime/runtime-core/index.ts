export const RUNTIME_PROTOCOL_VERSION = "0.6.0-milestone-006";

export type JsonContentType = "application/json";
export type DocumentSessionLifecycleState = "created" | "mounted" | "document-loaded" | "disposed";
export type StructuralNodeKind = "object" | "array" | "property" | "string" | "number" | "boolean" | "null";
export type RuntimeDiagnosticSeverity = "error";
export type JsonScalarValue = string | number | boolean | null;
export type RuntimeTransactionKind =
  | "replaceValue"
  | "setPropertyValue"
  | "removeProperty"
  | "insertArrayItem"
  | "removeArrayItem";
export type JsonArrayDto = JsonValueDto[];
export interface JsonObjectDto {
  [propertyName: string]: JsonValueDto;
}
export type JsonValueDto = JsonScalarValue | JsonObjectDto | JsonArrayDto;

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

export interface PreparedViewportRequestDto {
  firstRow: number;
  rowCount: number;
}

export interface PreparedOpenRequestDto {
  sessionId: string;
  documentId: string;
  initialViewport?: PreparedViewportRequestDto | undefined;
}

export interface PreparedIndexStateDto {
  name: string;
  state: "missing" | "building" | "ready" | "stale" | "failed";
  version?: number | undefined;
  message?: string | undefined;
}

export interface PreparedDocumentMetadataDto {
  sessionId: string;
  documentId: string;
  revision: number;
  sourceByteLength: number;
  sourceEncoding: "utf-8";
  documentState: "ready" | "failed" | "deleted" | "unknown";
  indexes: Record<string, PreparedIndexStateDto>;
  capabilities: string[];
}

export interface PreparedOpenResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision?: number | undefined;
  metadata?: PreparedDocumentMetadataDto | undefined;
  diagnostics?: RuntimeDiagnosticDto[] | undefined;
}

export interface PreparedTextRangeRequestDto {
  sessionId: string;
  startByteOffset: number;
  maxByteLength: number;
}

export interface PreparedTextRangeDto {
  sessionId: string;
  documentId: string;
  revision: number;
  requestedStartByteOffset: number;
  actualStartByteOffset: number;
  actualEndByteOffset: number;
  text: string;
  truncated: boolean;
  diagnostics?: RuntimeDiagnosticDto[] | undefined;
}

export interface PreparedRowsRequestDto {
  sessionId: string;
  firstRow: number;
  rowCount: number;
  foldStateRevision?: number | undefined;
}

export interface PreparedRenderRowDto {
  rowIndex: number;
  kind: "node" | "foldPlaceholder" | "diagnostic";
  nodeId?: string | undefined;
  depth: number;
  text: string;
  folded?: boolean | undefined;
  startByteOffset?: number | undefined;
  endByteOffset?: number | undefined;
  path?: string | undefined;
  diagnostics?: RuntimeDiagnosticDto[] | undefined;
}

export interface PreparedRowsResultDto {
  sessionId: string;
  documentId: string;
  revision: number;
  firstRow: number;
  rowCount: number;
  totalKnownRows?: number | undefined;
  rows: PreparedRenderRowDto[];
  diagnostics?: RuntimeDiagnosticDto[] | undefined;
}

export interface PreparedFoldStateRequestDto {
  sessionId: string;
  nodeId: string;
  folded: boolean;
}

export interface PreparedFoldStateResultDto {
  success: boolean;
  foldStateRevision: number;
  diagnostics?: RuntimeDiagnosticDto[] | undefined;
}

export interface PreparedSearchRequestDto {
  sessionId: string;
  query: string;
  scope?: "allText" | "propertyNames" | "stringValues" | undefined;
  ignoreCase?: boolean | undefined;
  maxResults: number;
  continuationToken?: string | undefined;
}

export interface PreparedSearchResultDto {
  resultId: string;
  revision: number;
  startByteOffset: number;
  endByteOffset: number;
  preview: string;
  path?: string | undefined;
  nodeId?: string | undefined;
}

export interface PreparedSearchResultPageDto {
  sessionId: string;
  documentId: string;
  revision: number;
  results: PreparedSearchResultDto[];
  continuationToken?: string | undefined;
  diagnostics?: RuntimeDiagnosticDto[] | undefined;
}

export type PreparedRevealTargetDto =
  | { kind: "byteRange"; startByteOffset: number; endByteOffset?: number | undefined }
  | {
      kind: "searchResult";
      resultId?: string | undefined;
      startByteOffset: number;
      endByteOffset: number;
      revision?: number | undefined;
    }
  | { kind: "jsonPointer"; path: string }
  | { kind: "node"; nodeId: string };

export type PreparedRevealFailureReasonDto =
  | "notFound"
  | "invalidTarget"
  | "notIndexed"
  | "indexMissing"
  | "indexStale"
  | "indexFailed"
  | "sessionNotFound"
  | "documentNotReady"
  | "revisionMismatch"
  | "unsupported";

export interface PreparedRevealRequestDto {
  sessionId: string;
  target: PreparedRevealTargetDto;
}

export interface PreparedRevealResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  reason?: PreparedRevealFailureReasonDto | undefined;
  rowIndex?: number | undefined;
  nodeId?: string | undefined;
  viewport?: PreparedViewportRequestDto | undefined;
  expandedNodeIds?: string[] | undefined;
  diagnostics?: RuntimeDiagnosticDto[] | undefined;
}

export type PreparedEditCommandKind =
  | "replaceNodeValue"
  | "renameProperty"
  | "insertProperty"
  | "removeProperty"
  | "insertArrayItem"
  | "removeArrayItem";

export interface PreparedEditCommandDto {
  sessionId: string;
  documentId: string;
  baseRevision: number;
  kind: PreparedEditCommandKind;
  targetNodeId?: string | undefined;
  targetPath?: string | undefined;
  propertyName?: string | undefined;
  newPropertyName?: string | undefined;
  index?: number | undefined;
  value?: JsonValueDto | undefined;
  label?: string | undefined;
}

export interface PreparedEditTransactionPayloadDto {
  targetNodeId?: string | undefined;
  targetPath?: string | undefined;
  parentNodeId?: string | undefined;
  parentPath?: string | undefined;
  propertyName?: string | undefined;
  newPropertyName?: string | undefined;
  index?: number | undefined;
  value?: JsonValueDto | undefined;
}

export interface PreparedDocumentTransactionDto {
  transactionId: string;
  sessionId: string;
  documentId: string;
  baseRevision: number;
  revision: number;
  kind: PreparedEditCommandKind;
  payload: PreparedEditTransactionPayloadDto;
  createdAt: string;
  label?: string | undefined;
}

export interface PreparedChangedRangeDto {
  startByteOffset: number;
  endByteOffset: number;
  nodeId?: string | undefined;
  path?: string | undefined;
}

export interface PreparedEditResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  baseRevision: number;
  revision: number;
  dirty: boolean;
  transaction?: PreparedDocumentTransactionDto | undefined;
  changedRanges?: PreparedChangedRangeDto[] | undefined;
  changedNodeIds?: string[] | undefined;
  invalidatedIndexes?: PreparedIndexStateDto[] | undefined;
  diagnostics?: RuntimeDiagnosticDto[] | undefined;
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

export interface ReplaceValueTransactionPayload {
  nodeId: string;
  value: JsonScalarValue;
}

export interface SetPropertyValueTransactionPayload {
  objectNodeId: string;
  propertyName: string;
  value: JsonValueDto;
}

export interface RemovePropertyTransactionPayload {
  objectNodeId: string;
  propertyName: string;
}

export interface InsertArrayItemTransactionPayload {
  arrayNodeId: string;
  index: number;
  value: JsonValueDto;
}

export interface RemoveArrayItemTransactionPayload {
  arrayNodeId: string;
  index: number;
}

export type RuntimeTransactionPayload =
  | ReplaceValueTransactionPayload
  | SetPropertyValueTransactionPayload
  | RemovePropertyTransactionPayload
  | InsertArrayItemTransactionPayload
  | RemoveArrayItemTransactionPayload;

export interface RuntimeTransactionDto {
  transactionId: string;
  sessionId: string;
  baseRevision: number;
  kind: RuntimeTransactionKind;
  payload: RuntimeTransactionPayload;
}

export interface ApplyTransactionCommand {
  sessionId: string;
  transaction: RuntimeTransactionDto;
}

export interface UndoCommand {
  sessionId: string;
}

export interface RedoCommand {
  sessionId: string;
}

export interface AttachSchemaCommand {
  sessionId: string;
  schemaId: string;
  schema: object;
}

export interface DetachSchemaCommand {
  sessionId: string;
  schemaId: string;
}

export interface GetSchemaMetadataForPathCommand {
  sessionId: string;
  path: string;
}

export interface CreateProjectionCommand {
  sessionId: string;
  projectionId: string;
  kind: string;
  sourcePath: string;
}

export interface DisposeProjectionCommand {
  sessionId: string;
  projectionId: string;
}

export interface ProjectionRowSelectionDto {
  kind: "row";
  rowId: string;
}

export interface ProjectionCellSelectionDto {
  kind: "cell";
  rowId: string;
  columnId: string;
}

export type ProjectionSelectionDto = ProjectionRowSelectionDto | ProjectionCellSelectionDto;

export interface SelectProjectionItemCommand {
  sessionId: string;
  projectionId: string;
  selection: ProjectionSelectionDto;
}

export interface EditProjectionCellCommand {
  sessionId: string;
  projectionId: string;
  rowId: string;
  columnId: string;
  value: JsonValueDto;
}

export interface RuntimePatchOperationDto {
  kind: RuntimeTransactionKind;
  path: string;
  value?: JsonValueDto | undefined;
}

export interface RuntimePatchDto {
  sessionId: string;
  documentId: string;
  baseRevision: number;
  newRevision: number;
  transactionId: string;
  operations: RuntimePatchOperationDto[];
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

export type SchemaDiagnosticSeverity = "info" | "warning" | "error";

export interface SchemaDiagnosticDto {
  diagnosticId: string;
  nodeId?: string | undefined;
  path: string;
  severity: SchemaDiagnosticSeverity;
  message: string;
  source: "schema";
}

export type SchemaOverlayDiagnosticSeverityDto = "info" | "warning" | "error";
export type SchemaOverlayDiagnosticSourceDto = "schemaOverlay";
export type SchemaOverlayRecoverabilityDto = "retry" | "rebuildIndex" | "changeSchema" | "unsupported" | "none";

export type UnsupportedSchemaKeywordClassificationDto =
  | "ignoredAnnotation"
  | "unsupportedValidationKeyword"
  | "unsupportedReference"
  | "unsupportedDraft";

export type SchemaOverlayDiagnosticCategoryDto =
  | "schemaNotAttached"
  | "invalidSchema"
  | "unsupportedDraft"
  | "unsupportedKeyword"
  | "unsupportedReference"
  | "referenceResolutionFailed"
  | "pathMetadataMissing"
  | "structuralMetadataMissing"
  | "indexMissing"
  | "indexBuilding"
  | "indexStale"
  | "indexFailed"
  | "revisionMismatch"
  | "targetNotFound"
  | "validationFailed"
  | "validationPartial"
  | "unsupportedOperation";

export interface SchemaOverlayDiagnosticDto {
  diagnosticId: string;
  category: SchemaOverlayDiagnosticCategoryDto;
  severity: SchemaOverlayDiagnosticSeverityDto;
  source: SchemaOverlayDiagnosticSourceDto;
  sessionId: string;
  documentId: string;
  revision?: number | undefined;
  overlayId?: string | undefined;
  schemaId?: string | undefined;
  nodeId?: string | undefined;
  path?: string | undefined;
  schemaPath?: string | undefined;
  message: string;
  recoverability?: SchemaOverlayRecoverabilityDto | undefined;
}

export type SchemaSourceDto =
  | { kind: "inline"; schema: unknown }
  | { kind: "namedLocal"; schemaId: string; schema: unknown }
  | { kind: "unsupported"; sourceDescription?: string | undefined };

export interface SchemaOverlayOptionsDto {
  maxDiagnostics?: number | undefined;
  includeUnsupportedKeywordDiagnostics?: boolean | undefined;
}

export interface SchemaOverlayAttachRequestDto {
  sessionId: string;
  documentId: string;
  baseRevision: number;
  schemaId: string;
  source: SchemaSourceDto;
  options?: SchemaOverlayOptionsDto | undefined;
}

export interface SchemaOverlayAttachResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string | undefined;
  schemaId?: string | undefined;
  diagnostics: SchemaOverlayDiagnosticDto[];
}

export interface SchemaOverlayDetachRequestDto {
  sessionId: string;
  documentId: string;
  overlayId?: string | undefined;
}

export interface SchemaOverlayDetachResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  detachedOverlayId?: string | undefined;
  diagnostics: SchemaOverlayDiagnosticDto[];
}

export type SchemaOverlayTargetDto =
  | { kind: "jsonPointer"; path: string }
  | { kind: "node"; nodeId: string }
  | { kind: "row"; rowIndex: number; nodeId?: string | undefined; path?: string | undefined };

export interface SchemaOverlayMetadataResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string | undefined;
  target: SchemaOverlayTargetDto;
  metadata?: SchemaNodeMetadataDto | undefined;
  diagnostics: SchemaOverlayDiagnosticDto[];
}

export interface SchemaNumericConstraintsDto {
  minimum?: number | undefined;
  maximum?: number | undefined;
}

export interface SchemaStringConstraintsDto {
  minLength?: number | undefined;
  maxLength?: number | undefined;
}

export interface SchemaArrayConstraintsDto {
  minItems?: number | undefined;
  maxItems?: number | undefined;
}

export interface UnsupportedSchemaKeywordDto {
  keyword: string;
  schemaPath: string;
  classification: UnsupportedSchemaKeywordClassificationDto;
  message: string;
}

export interface SchemaNodeMetadataDto {
  nodeId?: string | undefined;
  path?: string | undefined;
  schemaPath: string;
  schemaId?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  expectedType?: string | string[] | undefined;
  enumValues?: JsonValueDto[] | undefined;
  constValue?: JsonValueDto | undefined;
  required?: boolean | undefined;
  defaultValue?: JsonValueDto | undefined;
  numericConstraints?: SchemaNumericConstraintsDto | undefined;
  stringConstraints?: SchemaStringConstraintsDto | undefined;
  arrayConstraints?: SchemaArrayConstraintsDto | undefined;
  unsupportedKeywords?: UnsupportedSchemaKeywordDto[] | undefined;
}

export type SchemaRowMarkerKindDto =
  | "schemaMetadata"
  | "description"
  | "required"
  | "enum"
  | "default"
  | "validationDiagnostic"
  | "unsupportedKeyword";

export interface SchemaRowDecorationDto {
  rowIndex: number;
  nodeId?: string | undefined;
  path?: string | undefined;
  overlayId: string;
  hasMetadata: boolean;
  hasDiagnostics: boolean;
  severity?: SchemaOverlayDiagnosticSeverityDto | undefined;
  markerKinds: SchemaRowMarkerKindDto[];
}

export interface SchemaDetailsRequestDto {
  sessionId: string;
  documentId: string;
  revision: number;
  target: SchemaOverlayTargetDto;
}

export interface SchemaDetailsResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string | undefined;
  target: SchemaOverlayTargetDto;
  metadata?: SchemaNodeMetadataDto | undefined;
  diagnostics: SchemaOverlayDiagnosticDto[];
}

export interface SchemaValidationRequestDto {
  sessionId: string;
  documentId: string;
  revision: number;
  target?: SchemaOverlayTargetDto | undefined;
  maxDiagnostics: number;
  continuationToken?: string | undefined;
}

export interface SchemaValidationResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string | undefined;
  diagnostics: SchemaOverlayDiagnosticDto[];
  continuationToken?: string | undefined;
  truncated: boolean;
}

export interface SchemaRowDecorationsRequestDto {
  sessionId: string;
  documentId: string;
  revision: number;
  rows: PreparedRenderRowDto[];
  maxDecorations: number;
}

export interface SchemaRowDecorationsResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string | undefined;
  decorations: SchemaRowDecorationDto[];
  diagnostics: SchemaOverlayDiagnosticDto[];
  truncated: boolean;
}

export type ProjectionCapability = "readRows" | "selectRow" | "selectCell" | "editCell";

export interface ProjectionDto {
  projectionId: string;
  sessionId: string;
  kind: string;
  sourcePath: string;
  capabilities: ProjectionCapability[];
}

export interface TableProjectionDto {
  projectionId: string;
  sourcePath: string;
  columns: TableColumnDto[];
  rows: TableRowDto[];
}

export interface TableColumnDto {
  columnId: string;
  propertyName: string;
  title?: string | undefined;
  expectedType?: string | string[] | undefined;
}

export interface TableRowDto {
  rowId: string;
  itemNodeId: string;
  index: number;
  cells: TableCellDto[];
}

export interface TableCellDto {
  columnId: string;
  propertyName: string;
  valueNodeId?: string | undefined;
  value: JsonValueDto | undefined;
  diagnostics?: SchemaDiagnosticDto[] | undefined;
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
  revision: number;
  options?: RuntimeOptionsDto | undefined;
  documentId?: string | undefined;
  text?: string | undefined;
  contentType?: JsonContentType | undefined;
  viewport?: ViewportDto | undefined;
  document?: StructuralIndexDocument | undefined;
  diagnostics: RuntimeDiagnosticDto[];
  schemaDiagnostics: SchemaDiagnosticDto[];
  schemaMetadataByNodeId: Record<string, SchemaNodeMetadataDto>;
  schemaAttachment?: SchemaAttachmentRecord | undefined;
  projectionsById: Record<string, ProjectionDto>;
  tableProjectionsById: Record<string, TableProjectionDto>;
  projectionSelectionsById: Record<string, ProjectionSelectionDto>;
  revealTargetNodeId?: string | undefined;
}

export interface SchemaAttachmentRecord {
  schemaId: string;
  documentId: string;
  schema: object;
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

export interface TransactionAppliedEventDto {
  type: "transactionApplied";
  sessionId: string;
  transactionId: string;
  baseRevision: number;
  newRevision: number;
}

export interface DocumentPatchProducedEventDto {
  type: "documentPatchProduced";
  sessionId: string;
  patch: RuntimePatchDto;
}

export interface TransactionRejectedEventDto {
  type: "transactionRejected";
  sessionId: string;
  transactionId: string;
  reason: string;
}

export interface SchemaAttachedEventDto {
  type: "schemaAttached";
  sessionId: string;
  schemaId: string;
}

export interface SchemaDiagnosticsChangedEventDto {
  type: "schemaDiagnosticsChanged";
  sessionId: string;
  diagnostics: SchemaDiagnosticDto[];
  schemaDiagnostics?: SchemaDiagnosticDto[] | undefined;
}

export interface SchemaMetadataChangedEventDto {
  type: "schemaMetadataChanged";
  sessionId: string;
  affectedNodeIds: string[];
}

export interface ProjectionCreatedEventDto {
  type: "projectionCreated";
  sessionId: string;
  projectionId: string;
  kind: string;
}

export interface ProjectionChangedEventDto {
  type: "projectionChanged";
  sessionId: string;
  projectionId: string;
}

export interface ProjectionSelectionChangedEventDto {
  type: "projectionSelectionChanged";
  sessionId: string;
  projectionId: string;
  sourceNodeId?: string | undefined;
  sourcePath?: string | undefined;
}

export type RuntimeEventDto =
  | SessionCreatedEventDto
  | SessionDisposedEventDto
  | RuntimeErrorEventDto
  | PlaceholderEventDto
  | DocumentLoadedEventDto
  | DiagnosticsChangedEventDto
  | TransactionAppliedEventDto
  | DocumentPatchProducedEventDto
  | TransactionRejectedEventDto
  | SchemaAttachedEventDto
  | SchemaDiagnosticsChangedEventDto
  | SchemaMetadataChangedEventDto
  | ProjectionCreatedEventDto
  | ProjectionChangedEventDto
  | ProjectionSelectionChangedEventDto;

export interface ParseJsonDocumentResult {
  document?: StructuralIndexDocument | undefined;
  diagnostics: RuntimeDiagnosticDto[];
}

export interface RevealPathResult {
  document: StructuralIndexDocument;
  targetNodeId?: string | undefined;
}

export interface TransactionAcceptedResult {
  accepted: true;
  session: DocumentSessionRecord;
  patch: RuntimePatchDto;
}

export interface TransactionRejectedResult {
  accepted: false;
  sessionId: string;
  transactionId: string;
  reason: string;
}

export type TransactionCommandResult = TransactionAcceptedResult | TransactionRejectedResult;

type PrimitiveStructuralNodeKind = "string" | "number" | "boolean" | "null";
type StructuralPathSegment = string | number;

interface RuntimeTransactionTemplate {
  kind: RuntimeTransactionKind;
  payload: RuntimeTransactionPayload;
}

interface SessionHistoryEntry {
  forward: RuntimeTransactionTemplate;
  reverse?: RuntimeTransactionTemplate | undefined;
  unsupportedUndoReason?: string | undefined;
}

interface InternalDocumentSessionRecord extends DocumentSessionRecord {
  undoStack: SessionHistoryEntry[];
  redoStack: SessionHistoryEntry[];
}

export interface SchemaOverlayUpdateResult {
  session: DocumentSessionRecord;
  affectedNodeIds: string[];
  diagnostics: SchemaDiagnosticDto[];
}

export interface ProjectionCreateResult {
  session: DocumentSessionRecord;
  projection: ProjectionDto;
}

export interface ProjectionDisposeResult {
  session: DocumentSessionRecord;
}

export interface ProjectionSelectionChangeResult {
  session: DocumentSessionRecord;
  projectionId: string;
  sourceNodeId?: string | undefined;
  sourcePath?: string | undefined;
}

interface TransactionMutationResult {
  nextRootValue: JsonValueDto;
  operation: RuntimePatchOperationDto;
  historyEntry: SessionHistoryEntry;
}

interface TransactionExecutionAcceptedResult {
  accepted: true;
  session: InternalDocumentSessionRecord;
  patch: RuntimePatchDto;
}

interface TransactionExecutionRejectedResult {
  accepted: false;
  sessionId: string;
  transactionId: string;
  reason: string;
}

type TransactionExecutionResult = TransactionExecutionAcceptedResult | TransactionExecutionRejectedResult;

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
      throw new JsonParseError(expectedMessage, this.position, Math.min(this.text.length, this.position + 1));
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
  private readonly sessions = new Map<string, InternalDocumentSessionRecord>();

  public createSession(command: CreateSessionCommand): DocumentSessionRecord {
    if (this.sessions.has(command.sessionId)) {
      throw new Error(`Session '${command.sessionId}' already exists.`);
    }

    const session: InternalDocumentSessionRecord = {
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
      revision: 0,
      text: command.text,
      diagnostics: parseResult.diagnostics,
      schemaDiagnostics: [],
      schemaMetadataByNodeId: {},
      schemaAttachment: undefined,
      projectionsById: {},
      tableProjectionsById: {},
      projectionSelectionsById: {},
      revealTargetNodeId: undefined,
      undoStack: [],
      redoStack: [],
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

  public applyTransaction(command: ApplyTransactionCommand): TransactionCommandResult {
    const session = this.sessions.get(command.sessionId);
    if (session === undefined) {
      return rejectTransaction(
        command.sessionId,
        command.transaction.transactionId,
        `Session '${command.sessionId}' is not available.`
      );
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

    let updatedSession: InternalDocumentSessionRecord = {
      ...result.session,
      undoStack: [...session.undoStack, ...result.session.undoStack.slice(session.undoStack.length)],
      redoStack: [],
      schemaAttachment: undefined,
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

  public undo(command: UndoCommand): TransactionCommandResult {
    const session = this.sessions.get(command.sessionId);
    if (session === undefined) {
      return rejectTransaction(
        command.sessionId,
        createSyntheticTransactionId("undo", 0),
        `Session '${command.sessionId}' is not available.`
      );
    }

    const transactionId = createSyntheticTransactionId("undo", session.revision + 1);
    const historyEntry = session.undoStack[session.undoStack.length - 1];

    if (historyEntry === undefined) {
      return rejectTransaction(command.sessionId, transactionId, "Undo stack is empty.");
    }

    if (historyEntry.reverse === undefined) {
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

    let updatedSession: InternalDocumentSessionRecord = {
      ...result.session,
      undoStack: session.undoStack.slice(0, -1),
      redoStack: [...session.redoStack, historyEntry],
      schemaAttachment: undefined,
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

  public redo(command: RedoCommand): TransactionCommandResult {
    const session = this.sessions.get(command.sessionId);
    if (session === undefined) {
      return rejectTransaction(
        command.sessionId,
        createSyntheticTransactionId("redo", 0),
        `Session '${command.sessionId}' is not available.`
      );
    }

    const transactionId = createSyntheticTransactionId("redo", session.revision + 1);
    const historyEntry = session.redoStack[session.redoStack.length - 1];

    if (historyEntry === undefined) {
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

    let updatedSession: InternalDocumentSessionRecord = {
      ...result.session,
      undoStack: [...session.undoStack, historyEntry],
      redoStack: session.redoStack.slice(0, -1),
      schemaAttachment: undefined,
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

  public attachSchema(command: AttachSchemaCommand): SchemaOverlayUpdateResult {
    const session = this.requireSession(command.sessionId);

    if (session.document === undefined || session.documentId === undefined || session.text === undefined) {
      throw new Error(`Session '${command.sessionId}' does not have a loaded document.`);
    }

    const overlay = resolveSchemaOverlay(session.document, session.text, command.schema);
    let updatedSession: InternalDocumentSessionRecord = {
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

  public detachSchema(command: DetachSchemaCommand): SchemaOverlayUpdateResult {
    const session = this.requireSession(command.sessionId);
    const previousNodeIds = Object.keys(session.schemaMetadataByNodeId);

    if (session.schemaAttachment === undefined || session.schemaAttachment.schemaId !== command.schemaId) {
      return {
        session,
        affectedNodeIds: [],
        diagnostics: session.schemaDiagnostics
      };
    }

    let updatedSession: InternalDocumentSessionRecord = {
      ...session,
      schemaAttachment: undefined,
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

  public getSchemaMetadataForPath(command: GetSchemaMetadataForPathCommand): SchemaNodeMetadataDto | undefined {
    const session = this.requireSession(command.sessionId);
    const document = session.document;
    if (document === undefined) {
      return undefined;
    }

    const nodeId = findNodeIdByPath(document, command.path);
    if (nodeId === undefined) {
      return undefined;
    }

    return session.schemaMetadataByNodeId[nodeId];
  }

  public createProjection(command: CreateProjectionCommand): ProjectionCreateResult {
    const session = this.requireSession(command.sessionId);
    if (session.projectionsById[command.projectionId] !== undefined) {
      throw new Error(`Projection '${command.projectionId}' already exists.`);
    }

    const projection = buildProjection(session, command);
    const updatedSession: InternalDocumentSessionRecord = {
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

  public disposeProjection(command: DisposeProjectionCommand): ProjectionDisposeResult {
    const session = this.requireSession(command.sessionId);
    if (session.projectionsById[command.projectionId] === undefined) {
      return { session };
    }

    const { [command.projectionId]: _, ...remainingProjections } = session.projectionsById;
    const { [command.projectionId]: __, ...remainingTables } = session.tableProjectionsById;
    const { [command.projectionId]: ___, ...remainingSelections } = session.projectionSelectionsById;
    const updatedSession: InternalDocumentSessionRecord = {
      ...session,
      projectionsById: remainingProjections,
      tableProjectionsById: remainingTables,
      projectionSelectionsById: remainingSelections
    };

    this.sessions.set(command.sessionId, updatedSession);
    return { session: updatedSession };
  }

  public selectProjectionItem(command: SelectProjectionItemCommand): ProjectionSelectionChangeResult {
    const session = this.requireSession(command.sessionId);
    const projection = session.projectionsById[command.projectionId];
    if (projection === undefined) {
      throw new Error(`Projection '${command.projectionId}' is not available.`);
    }

    const selectionSource = resolveProjectionSelectionSource(session, command.projectionId, command.selection);
    const updatedSession: InternalDocumentSessionRecord = {
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

  public editProjectionCell(command: EditProjectionCellCommand): TransactionCommandResult {
    const session = this.requireSession(command.sessionId);
    const tableProjection = session.tableProjectionsById[command.projectionId];
    if (tableProjection === undefined) {
      return rejectTransaction(
        command.sessionId,
        `projection-edit-${session.revision + 1}`,
        `Projection '${command.projectionId}' is not available.`
      );
    }

    const row = tableProjection.rows.find((entry) => entry.rowId === command.rowId);
    if (row === undefined) {
      return rejectTransaction(
        command.sessionId,
        `projection-edit-${session.revision + 1}`,
        `Row '${command.rowId}' is not available.`
      );
    }

    const cell = row.cells.find((entry) => entry.columnId === command.columnId);
    if (cell === undefined) {
      return rejectTransaction(
        command.sessionId,
        `projection-edit-${session.revision + 1}`,
        `Column '${command.columnId}' is not available for row '${command.rowId}'.`
      );
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

  public clearRevealTarget(sessionId: string): DocumentSessionRecord {
    return this.updateSession(sessionId, (session) => ({
      ...session,
      revealTargetNodeId: undefined
    }));
  }

  public disposeSession(command: DisposeSessionCommand): DocumentSessionRecord {
    const session = this.requireSession(command.sessionId);
    const disposedSession: InternalDocumentSessionRecord = {
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

  private executeTransaction(
    session: InternalDocumentSessionRecord,
    transaction: RuntimeTransactionDto
  ): TransactionExecutionResult {
    if (session.document === undefined || session.documentId === undefined || session.text === undefined) {
      return rejectTransaction(
        session.sessionId,
        transaction.transactionId,
        "Session does not have a loaded document."
      );
    }

    if (transaction.baseRevision !== session.revision) {
      return rejectTransaction(
        session.sessionId,
        transaction.transactionId,
        `Transaction base revision ${transaction.baseRevision} does not match current revision ${session.revision}.`
      );
    }

    const currentRootValue = parseJsonText(session.text);
    if (currentRootValue === undefined) {
      return rejectTransaction(
        session.sessionId,
        transaction.transactionId,
        "Current document text is not valid JSON."
      );
    }

    const mutationResult = applyTransactionMutation(session.document, currentRootValue, transaction);
    if (!("nextRootValue" in mutationResult)) {
      return mutationResult;
    }

    const nextText = serializeJsonValue(mutationResult.nextRootValue);
    if (nextText === undefined) {
      return rejectTransaction(
        session.sessionId,
        transaction.transactionId,
        "Updated document is not representable as valid JSON."
      );
    }

    const parseResult = parseJsonDocument(nextText);
    if (parseResult.document === undefined) {
      return rejectTransaction(
        session.sessionId,
        transaction.transactionId,
        "Updated document could not be re-indexed."
      );
    }

    const updatedSession: InternalDocumentSessionRecord = {
      ...session,
      revision: session.revision + 1,
      text: nextText,
      document: preserveFoldState(session.document, parseResult.document),
      diagnostics: parseResult.diagnostics,
      revealTargetNodeId: undefined,
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

  private updateSession(
    sessionId: string,
    update: (session: InternalDocumentSessionRecord) => InternalDocumentSessionRecord
  ): DocumentSessionRecord {
    const session = this.requireSession(sessionId);
    const updatedSession = update(session);

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  private requireSession(sessionId: string): InternalDocumentSessionRecord {
    const session = this.sessions.get(sessionId);

    if (session === undefined) {
      throw new Error(`Session '${sessionId}' is not available.`);
    }

    if (session.lifecycleState === "disposed") {
      throw new Error(`Session '${sessionId}' has been disposed.`);
    }

    return session;
  }

  private rebuildProjections(session: InternalDocumentSessionRecord): InternalDocumentSessionRecord {
    const projectionEntries = Object.values(session.projectionsById);
    if (projectionEntries.length === 0) {
      return session;
    }

    const projectionsById: Record<string, ProjectionDto> = {};
    const tableProjectionsById: Record<string, TableProjectionDto> = {};
    const projectionSelectionsById: Record<string, ProjectionSelectionDto> = {};

    for (const projection of projectionEntries) {
      try {
        const rebuilt = buildProjection(session, projection);
        projectionsById[projection.projectionId] = rebuilt.projection;
        tableProjectionsById[projection.projectionId] = rebuilt.table;
        const existingSelection = session.projectionSelectionsById[projection.projectionId];
        if (existingSelection !== undefined) {
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
}

interface ProjectionBuildResult {
  projection: ProjectionDto;
  table: TableProjectionDto;
}

interface ProjectionSelectionSourceResult {
  sourceNodeId?: string | undefined;
  sourcePath?: string | undefined;
}

function buildProjection(
  session: Pick<DocumentSessionRecord, "document" | "text" | "schemaAttachment" | "schemaDiagnostics"> & {
    sessionId: string;
  },
  command: Pick<CreateProjectionCommand, "projectionId" | "kind" | "sourcePath">
): ProjectionBuildResult {
  if (command.kind !== "table.arrayOfObjects") {
    throw new Error(`Projection kind '${command.kind}' is not supported.`);
  }

  if (session.document === undefined || session.text === undefined) {
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

function buildTableArrayOfObjectsProjection(
  document: StructuralIndexDocument,
  text: string,
  projectionId: string,
  sourcePath: string,
  schemaDiagnostics: SchemaDiagnosticDto[],
  schema: object | undefined
): TableProjectionDto {
  const sourceNodeId = findNodeIdByPath(document, sourcePath);
  if (sourceNodeId === undefined) {
    throw new Error(`Projection source path '${sourcePath}' was not found.`);
  }

  const sourceNode = document.nodesById[sourceNodeId];
  if (sourceNode === undefined || sourceNode.kind !== "array") {
    throw new Error(`Projection source path '${sourcePath}' must resolve to an array node.`);
  }

  const rowNodeIds = listChildNodeIds(document, sourceNode.nodeId);
  for (const rowNodeId of rowNodeIds) {
    const rowNode = document.nodesById[rowNodeId];
    if (rowNode === undefined || rowNode.kind !== "object") {
      throw new Error(`Projection source path '${sourcePath}' must contain only object items.`);
    }
  }

  const rootValue = parseJsonText(text);
  if (rootValue === undefined) {
    throw new Error("Projection source document is not valid JSON.");
  }

  const sourceValue = getJsonValueAtPath(rootValue, sourcePath);
  if (!isJsonArrayDto(sourceValue) || !sourceValue.every((entry) => isJsonObjectDto(entry))) {
    throw new Error(`Projection source path '${sourcePath}' must resolve to an array of objects.`);
  }

  const propertyNames = collectProjectionPropertyNames(document, rowNodeIds);
  const columns = propertyNames.map((propertyName, index) =>
    createTableColumn(sourcePath, propertyName, index, schema)
  );
  const columnByPropertyName = new Map(columns.map((column) => [column.propertyName, column]));
  const rows: TableRowDto[] = rowNodeIds.map((rowNodeId, index) => {
    const rowNode = document.nodesById[rowNodeId];
    if (rowNode === undefined) {
      throw new Error(`Projection row node '${rowNodeId}' is not available.`);
    }

    return {
      rowId: `row-${index}`,
      itemNodeId: rowNode.nodeId,
      index,
      cells: propertyNames.map((propertyName) => {
        const column = columnByPropertyName.get(propertyName);
        if (column === undefined) {
          throw new Error(`Projection column '${propertyName}' is not available.`);
        }

        const cellPath = appendObjectPath(rowNode.path, propertyName);
        const valueNodeId = findNodeIdByPath(document, cellPath);
        const cellDiagnostics = schemaDiagnostics.filter(
          (diagnostic) =>
            diagnostic.path === cellPath || (valueNodeId !== undefined && diagnostic.nodeId === valueNodeId)
        );
        const value = getJsonValueAtPath(rootValue, cellPath);
        return {
          columnId: column.columnId,
          propertyName,
          ...(valueNodeId !== undefined ? { valueNodeId } : {}),
          value,
          ...(cellDiagnostics.length > 0 ? { diagnostics: cellDiagnostics } : {})
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

function collectProjectionPropertyNames(document: StructuralIndexDocument, rowNodeIds: string[]): string[] {
  const names: string[] = [];
  const nameSet = new Set<string>();

  for (const rowNodeId of rowNodeIds) {
    for (const propertyNodeId of listChildNodeIds(document, rowNodeId)) {
      const propertyNode = document.nodesById[propertyNodeId];
      const propertyName = propertyNode?.propertyName;
      if (
        propertyNode === undefined ||
        propertyNode.kind !== "property" ||
        propertyName === undefined ||
        nameSet.has(propertyName)
      ) {
        continue;
      }

      nameSet.add(propertyName);
      names.push(propertyName);
    }
  }

  return names;
}

function createTableColumn(
  sourcePath: string,
  propertyName: string,
  index: number,
  schema: object | undefined
): TableColumnDto {
  const columnId = `column-${index}`;
  if (schema === undefined) {
    return {
      columnId,
      propertyName
    };
  }

  const schemaResult = resolveSchemaForPath(schema, appendObjectPath(`${sourcePath}[0]`, propertyName));
  const resolvedSchema = schemaResult.resolvedSchema;
  if (resolvedSchema === undefined) {
    return {
      columnId,
      propertyName
    };
  }

  const expectedType = parseSchemaType(resolvedSchema.type);

  return {
    columnId,
    propertyName,
    ...(typeof resolvedSchema.title === "string" ? { title: resolvedSchema.title } : {}),
    ...(expectedType !== undefined ? { expectedType } : {})
  };
}

function resolveProjectionSelectionSource(
  session: Pick<DocumentSessionRecord, "tableProjectionsById">,
  projectionId: string,
  selection: ProjectionSelectionDto
): ProjectionSelectionSourceResult {
  const tableProjection = session.tableProjectionsById[projectionId];
  if (tableProjection === undefined) {
    throw new Error(`Projection '${projectionId}' is not available.`);
  }

  const row = tableProjection.rows.find((entry) => entry.rowId === selection.rowId);
  if (row === undefined) {
    throw new Error(`Projection row '${selection.rowId}' is not available.`);
  }

  if (selection.kind === "row") {
    return {
      sourceNodeId: row.itemNodeId,
      sourcePath: `${tableProjection.sourcePath}[${row.index}]`
    };
  }

  const cell = row.cells.find((entry) => entry.columnId === selection.columnId);
  if (cell === undefined) {
    throw new Error(`Projection column '${selection.columnId}' is not available for row '${selection.rowId}'.`);
  }

  return {
    sourceNodeId: cell.valueNodeId,
    sourcePath: appendObjectPath(`${tableProjection.sourcePath}[${row.index}]`, cell.propertyName)
  };
}

function appendObjectPath(parentPath: string, propertyName: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/u.test(propertyName)) {
    return `${parentPath}.${propertyName}`;
  }

  return `${parentPath}[${JSON.stringify(propertyName)}]`;
}

function applyTransactionMutation(
  document: StructuralIndexDocument,
  rootValue: JsonValueDto,
  transaction: RuntimeTransactionDto
): TransactionMutationResult | TransactionRejectedResult {
  switch (transaction.kind) {
    case "replaceValue":
      return applyReplaceValueTransaction(document, rootValue, transaction);
    case "setPropertyValue":
      return applySetPropertyValueTransaction(document, rootValue, transaction);
    case "removeProperty":
      return applyRemovePropertyTransaction(document, rootValue, transaction);
    case "insertArrayItem":
      return applyInsertArrayItemTransaction(document, rootValue, transaction);
    case "removeArrayItem":
      return applyRemoveArrayItemTransaction(document, rootValue, transaction);
  }
}

function applyReplaceValueTransaction(
  document: StructuralIndexDocument,
  rootValue: JsonValueDto,
  transaction: RuntimeTransactionDto
): TransactionMutationResult | TransactionRejectedResult {
  if (!isReplaceValuePayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "replaceValue payload is invalid.");
  }

  if (!isJsonScalarValue(transaction.payload.value)) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      "replaceValue requires a primitive JSON value."
    );
  }

  const node = document.nodesById[transaction.payload.nodeId];
  if (node === undefined) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${transaction.payload.nodeId}' was not found.`
    );
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
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target path '${node.path}' did not resolve to a primitive value.`
    );
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

function applySetPropertyValueTransaction(
  document: StructuralIndexDocument,
  rootValue: JsonValueDto,
  transaction: RuntimeTransactionDto
): TransactionMutationResult | TransactionRejectedResult {
  if (!isSetPropertyValuePayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "setPropertyValue payload is invalid.");
  }

  if (!isJsonValueDto(transaction.payload.value)) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      "setPropertyValue requires a valid JSON value."
    );
  }

  const objectNode = document.nodesById[transaction.payload.objectNodeId];
  if (objectNode === undefined) {
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
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target path '${objectNode.path}' did not resolve to an object.`
    );
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

function applyRemovePropertyTransaction(
  document: StructuralIndexDocument,
  rootValue: JsonValueDto,
  transaction: RuntimeTransactionDto
): TransactionMutationResult | TransactionRejectedResult {
  if (!isRemovePropertyPayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "removeProperty payload is invalid.");
  }

  const objectNode = document.nodesById[transaction.payload.objectNodeId];
  if (objectNode === undefined) {
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
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target path '${objectNode.path}' did not resolve to an object.`
    );
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

function applyInsertArrayItemTransaction(
  document: StructuralIndexDocument,
  rootValue: JsonValueDto,
  transaction: RuntimeTransactionDto
): TransactionMutationResult | TransactionRejectedResult {
  if (!isInsertArrayItemPayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "insertArrayItem payload is invalid.");
  }

  if (!isJsonValueDto(transaction.payload.value)) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      "insertArrayItem requires a valid JSON value."
    );
  }

  const arrayNode = document.nodesById[transaction.payload.arrayNodeId];
  if (arrayNode === undefined) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${transaction.payload.arrayNodeId}' was not found.`
    );
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
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target path '${arrayNode.path}' did not resolve to an array.`
    );
  }

  if (
    !Number.isInteger(transaction.payload.index) ||
    transaction.payload.index < 0 ||
    transaction.payload.index > arrayValue.length
  ) {
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

function applyRemoveArrayItemTransaction(
  document: StructuralIndexDocument,
  rootValue: JsonValueDto,
  transaction: RuntimeTransactionDto
): TransactionMutationResult | TransactionRejectedResult {
  if (!isRemoveArrayItemPayload(transaction.payload)) {
    return rejectTransaction(transaction.sessionId, transaction.transactionId, "removeArrayItem payload is invalid.");
  }

  const arrayNode = document.nodesById[transaction.payload.arrayNodeId];
  if (arrayNode === undefined) {
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target node '${transaction.payload.arrayNodeId}' was not found.`
    );
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
    return rejectTransaction(
      transaction.sessionId,
      transaction.transactionId,
      `Target path '${arrayNode.path}' did not resolve to an array.`
    );
  }

  if (
    !Number.isInteger(transaction.payload.index) ||
    transaction.payload.index < 0 ||
    transaction.payload.index >= arrayValue.length
  ) {
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

function preserveFoldState(
  previousDocument: StructuralIndexDocument,
  nextDocument: StructuralIndexDocument
): StructuralIndexDocument {
  let updatedDocument = nextDocument;

  for (const nodeId of previousDocument.nodeOrder) {
    const node = previousDocument.nodesById[nodeId];
    if (node === undefined || !node.foldable || !node.folded) {
      continue;
    }

    const nextNodeId = findNodeIdByPath(updatedDocument, node.path);
    if (nextNodeId === undefined) {
      continue;
    }

    updatedDocument = updateDocumentNode(updatedDocument, nextNodeId, { folded: true });
  }

  return updatedDocument;
}

function rejectTransaction(sessionId: string, transactionId: string, reason: string): TransactionRejectedResult {
  return {
    accepted: false,
    sessionId,
    transactionId,
    reason
  };
}

function createSyntheticTransactionId(prefix: "undo" | "redo", revision: number): string {
  return `${prefix}-${revision}`;
}

function parseJsonText(text: string): JsonValueDto | undefined {
  try {
    const parsed = JSON.parse(text) as unknown;
    return isJsonValueDto(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function serializeJsonValue(value: JsonValueDto): string | undefined {
  if (!isJsonValueDto(value)) {
    return undefined;
  }

  return JSON.stringify(value, undefined, 2);
}

function getJsonValueAtPath(rootValue: JsonValueDto, path: string): JsonValueDto | undefined {
  const segments = parseStructuralPath(path);
  let currentValue: JsonValueDto | undefined = rootValue;

  for (const segment of segments) {
    if (typeof segment === "number") {
      if (!isJsonArrayDto(currentValue)) {
        return undefined;
      }

      currentValue = currentValue[segment];
      continue;
    }

    if (!isJsonObjectDto(currentValue)) {
      return undefined;
    }

    currentValue = currentValue[segment];
  }

  return currentValue;
}

function setJsonValueAtPath(rootValue: JsonValueDto, path: string, nextValue: JsonValueDto): JsonValueDto {
  const segments = parseStructuralPath(path);

  if (segments.length === 0) {
    return cloneJsonValue(nextValue);
  }

  const parentValue = getJsonValueAtPath(rootValue, formatStructuralPath(segments.slice(0, -1)));
  const lastSegment = segments[segments.length - 1];
  if (lastSegment === undefined) {
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

function parseStructuralPath(path: string): StructuralPathSegment[] {
  if (path === "$") {
    return [];
  }

  if (!path.startsWith("$")) {
    throw new Error(`Unsupported structural path '${path}'.`);
  }

  const segments: StructuralPathSegment[] = [];
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
        segments.push(JSON.parse(rawSegment) as string);
      }

      index = closingIndex + 1;
      continue;
    }

    throw new Error(`Unsupported structural path '${path}'.`);
  }

  return segments;
}

function formatStructuralPath(segments: StructuralPathSegment[]): string {
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

function findBracketEnd(path: string, startIndex: number): number {
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

function cloneJsonValue<T extends JsonValueDto>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function isPrimitiveNodeKind(kind: StructuralNodeKind): kind is PrimitiveStructuralNodeKind {
  return kind === "string" || kind === "number" || kind === "boolean" || kind === "null";
}

function isJsonScalarValue(value: unknown): value is JsonScalarValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function isJsonArrayDto(value: unknown): value is JsonArrayDto {
  return Array.isArray(value) && value.every((item) => isJsonValueDto(item));
}

function isJsonObjectDto(value: unknown): value is JsonObjectDto {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => isJsonValueDto(item))
  );
}

function isJsonValueDto(value: unknown): value is JsonValueDto {
  return isJsonScalarValue(value) || isJsonArrayDto(value) || isJsonObjectDto(value);
}

interface SchemaOverlayResolution {
  metadataByNodeId: Record<string, SchemaNodeMetadataDto>;
  diagnostics: SchemaDiagnosticDto[];
}

interface SchemaTypeMismatchExpectation {
  expectedType: string | string[];
  allowedTypes: Array<"string" | "number" | "integer" | "boolean" | "null">;
}

function resolveSchemaOverlay(
  document: StructuralIndexDocument,
  text: string,
  schema: object
): SchemaOverlayResolution {
  const metadataByNodeId: Record<string, SchemaNodeMetadataDto> = {};
  const diagnostics: SchemaDiagnosticDto[] = [];
  const rootValue = parseJsonText(text);

  if (rootValue === undefined) {
    return { metadataByNodeId, diagnostics };
  }

  for (const nodeId of document.nodeOrder) {
    const node = document.nodesById[nodeId];
    if (node === undefined || node.kind === "property") {
      continue;
    }

    const resolution = resolveSchemaForPath(schema, node.path);
    if (resolution.resolvedSchema === undefined) {
      continue;
    }

    const nodeValue = getJsonValueAtPath(rootValue, node.path);
    if (nodeValue === undefined) {
      continue;
    }

    const metadata = createSchemaNodeMetadata(
      nodeId,
      resolution.schemaPath,
      resolution.resolvedSchema,
      resolution.required
    );
    metadataByNodeId[nodeId] = metadata;
    collectSchemaDiagnostics(diagnostics, node, nodeValue, metadata, resolution.resolvedSchema);
  }

  return {
    metadataByNodeId,
    diagnostics
  };
}

function createSchemaNodeMetadata(
  nodeId: string,
  schemaPath: string,
  schema: JsonObjectDto,
  required: boolean
): SchemaNodeMetadataDto {
  const metadata: SchemaNodeMetadataDto = {
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
  if (expectedType !== undefined) {
    metadata.expectedType = expectedType;
  }

  if (Array.isArray(schema.enum) && schema.enum.every((value) => isJsonValueDto(value))) {
    metadata.enumValues = schema.enum.map((value) => cloneJsonValue(value));
  }

  if (required) {
    metadata.required = true;
  }

  if (schema.default !== undefined && isJsonValueDto(schema.default)) {
    metadata.defaultValue = cloneJsonValue(schema.default);
  }

  return metadata;
}

function collectSchemaDiagnostics(
  diagnostics: SchemaDiagnosticDto[],
  node: StructuralNodeRecord,
  nodeValue: JsonValueDto,
  metadata: SchemaNodeMetadataDto,
  schema: JsonObjectDto
): void {
  const typeExpectation = getPrimitiveTypeExpectation(metadata.expectedType);
  if (typeExpectation !== undefined) {
    const actualType = getSchemaTypeForValue(nodeValue);
    if (
      isPrimitiveSchemaType(actualType) &&
      !typeExpectation.allowedTypes.some((expected) => matchesPrimitiveSchemaType(expected, actualType))
    ) {
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

  if (
    Array.isArray(metadata.enumValues) &&
    !metadata.enumValues.some((value) => areJsonValuesEqual(value, nodeValue))
  ) {
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

function resolveSchemaForPath(
  rootSchema: object,
  path: string
): { resolvedSchema?: JsonObjectDto | undefined; schemaPath: string; required: boolean } {
  if (!isJsonObjectDto(rootSchema)) {
    return { resolvedSchema: undefined, schemaPath: "#", required: false };
  }

  let currentSchema: JsonObjectDto | undefined = rootSchema;
  let schemaPath = "#";
  let required = false;
  const segments = parseStructuralPath(path);

  for (const segment of segments) {
    if (currentSchema === undefined) {
      break;
    }

    if (typeof segment === "number") {
      const itemsCandidate: unknown = currentSchema["items"];
      if (!isJsonObjectDto(itemsCandidate)) {
        currentSchema = undefined;
        break;
      }

      currentSchema = itemsCandidate;
      schemaPath += "/items";
      required = false;
      continue;
    }

    const propertiesCandidate: unknown = currentSchema["properties"];
    const propertySchema = isJsonObjectDto(propertiesCandidate) ? propertiesCandidate[segment] : undefined;
    if (!isJsonObjectDto(propertySchema)) {
      currentSchema = undefined;
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

function parseSchemaType(value: unknown): string | string[] | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return [...value];
  }

  return undefined;
}

function parseRequiredProperties(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function getPrimitiveTypeExpectation(
  expectedType: string | string[] | undefined
): SchemaTypeMismatchExpectation | undefined {
  if (expectedType === undefined) {
    return undefined;
  }

  const allowedTypes = (Array.isArray(expectedType) ? expectedType : [expectedType]).filter(isPrimitiveSchemaType);
  if (allowedTypes.length === 0) {
    return undefined;
  }

  return {
    expectedType,
    allowedTypes
  };
}

function isPrimitiveSchemaType(value: string): value is "string" | "number" | "integer" | "boolean" | "null" {
  return value === "string" || value === "number" || value === "integer" || value === "boolean" || value === "null";
}

function matchesPrimitiveSchemaType(
  expected: "string" | "number" | "integer" | "boolean" | "null",
  actual: "string" | "number" | "integer" | "boolean" | "null"
): boolean {
  if (expected === "number" && actual === "integer") {
    return true;
  }

  return expected === actual;
}

function getSchemaTypeForValue(value: JsonValueDto): string {
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

function formatExpectedType(expectedType: string | string[]): string {
  return Array.isArray(expectedType) ? expectedType.map((entry) => `'${entry}'`).join(" or ") : `'${expectedType}'`;
}

function areJsonValuesEqual(left: JsonValueDto, right: JsonValueDto): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function createSchemaDiagnosticId(nodeId: string, suffix: string): string {
  return `${nodeId}:${suffix}`;
}

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/gu, "~0").replace(/\//gu, "~1");
}

function isReplaceValuePayload(payload: RuntimeTransactionPayload): payload is ReplaceValueTransactionPayload {
  return "nodeId" in payload && "value" in payload;
}

function isSetPropertyValuePayload(payload: RuntimeTransactionPayload): payload is SetPropertyValueTransactionPayload {
  return "objectNodeId" in payload && "propertyName" in payload && "value" in payload;
}

function isRemovePropertyPayload(payload: RuntimeTransactionPayload): payload is RemovePropertyTransactionPayload {
  return "objectNodeId" in payload && "propertyName" in payload && !("value" in payload);
}

function isInsertArrayItemPayload(payload: RuntimeTransactionPayload): payload is InsertArrayItemTransactionPayload {
  return "arrayNodeId" in payload && "index" in payload && "value" in payload;
}

function isRemoveArrayItemPayload(payload: RuntimeTransactionPayload): payload is RemoveArrayItemTransactionPayload {
  return "arrayNodeId" in payload && "index" in payload && !("value" in payload);
}

function isIdentifierPathCharacter(character: string | undefined): boolean {
  return character !== undefined && /[A-Za-z0-9_]/u.test(character);
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

export interface PreparedSchemaOverlaySessionSnapshot {
  sessionId: string;
  documentId: string;
  revision: number;
  rows?: PreparedRenderRowDto[] | undefined;
  nodePathsById?: Record<string, string> | undefined;
  valuesByPath?: Record<string, JsonValueDto> | undefined;
}

interface PreparedSchemaOverlayRecord {
  overlayId: string;
  sessionId: string;
  documentId: string;
  revision: number;
  schemaId: string;
  schema: JsonObjectDto;
  options: Required<SchemaOverlayOptionsDto>;
  unsupportedKeywords: UnsupportedSchemaKeywordDto[];
  attachDiagnostics: SchemaOverlayDiagnosticDto[];
}

interface PreparedSchemaResolutionResult {
  schema?: JsonObjectDto | undefined;
  schemaPath: string;
  required: boolean;
  diagnostics: SchemaOverlayDiagnosticDto[];
}

const SUPPORTED_SCHEMA_DRAFT = "https://json-schema.org/draft/2020-12/schema";
const DEFAULT_SCHEMA_OVERLAY_OPTIONS: Required<SchemaOverlayOptionsDto> = {
  maxDiagnostics: 50,
  includeUnsupportedKeywordDiagnostics: true
};
const SUPPORTED_SCHEMA_KEYWORDS = new Set([
  "$schema",
  "$id",
  "$ref",
  "$defs",
  "type",
  "properties",
  "items",
  "required",
  "enum",
  "const",
  "title",
  "description",
  "default",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems"
]);
const UNSUPPORTED_VALIDATION_KEYWORDS = new Set([
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "pattern",
  "format",
  "additionalProperties",
  "patternProperties",
  "dependentRequired",
  "dependentSchemas",
  "contains",
  "uniqueItems",
  "multipleOf",
  "exclusiveMinimum",
  "exclusiveMaximum"
]);
const IGNORED_ANNOTATION_KEYWORDS = new Set(["examples", "readOnly", "writeOnly", "deprecated", "$comment"]);

export class PreparedSchemaOverlayRegistry {
  private readonly overlaysBySessionId = new Map<string, PreparedSchemaOverlayRecord>();

  public attach(
    request: SchemaOverlayAttachRequestDto,
    currentRevision = request.baseRevision
  ): SchemaOverlayAttachResultDto {
    const diagnostics: SchemaOverlayDiagnosticDto[] = [];
    if (request.baseRevision !== currentRevision) {
      diagnostics.push(
        createSchemaOverlayDiagnostic(request, {
          category: "revisionMismatch",
          severity: "error",
          revision: currentRevision,
          message: `Schema overlay attach base revision ${request.baseRevision} does not match current revision ${currentRevision}.`,
          recoverability: "retry"
        })
      );
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        revision: currentRevision,
        diagnostics
      };
    }

    const schema = getAttachSchema(request, diagnostics, currentRevision);
    if (schema === undefined) {
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        revision: currentRevision,
        diagnostics
      };
    }

    const options = { ...DEFAULT_SCHEMA_OVERLAY_OPTIONS, ...(request.options ?? {}) };
    const unsupportedKeywords = collectUnsupportedSchemaKeywords(schema, "#");
    if (typeof schema.$schema === "string" && schema.$schema !== SUPPORTED_SCHEMA_DRAFT) {
      unsupportedKeywords.push({
        keyword: "$schema",
        schemaPath: "#/$schema",
        classification: "unsupportedDraft",
        message: `Schema draft '${schema.$schema}' is not fully supported; only Draft 2020-12 subset behavior is implemented.`
      });
    }

    if (options.includeUnsupportedKeywordDiagnostics) {
      for (const keyword of unsupportedKeywords.slice(0, options.maxDiagnostics)) {
        diagnostics.push(
          createSchemaOverlayDiagnostic(request, {
            category:
              keyword.classification === "unsupportedReference"
                ? "unsupportedReference"
                : keyword.classification === "unsupportedDraft"
                  ? "unsupportedDraft"
                  : "unsupportedKeyword",
            severity: keyword.classification === "ignoredAnnotation" ? "info" : "warning",
            revision: currentRevision,
            schemaId: request.schemaId,
            schemaPath: keyword.schemaPath,
            message: keyword.message,
            recoverability: keyword.classification === "ignoredAnnotation" ? "none" : "unsupported"
          })
        );
      }
    }

    const overlayId = `${request.sessionId}:${request.schemaId}:${currentRevision}`;
    this.overlaysBySessionId.set(request.sessionId, {
      overlayId,
      sessionId: request.sessionId,
      documentId: request.documentId,
      revision: currentRevision,
      schemaId: request.schemaId,
      schema,
      options,
      unsupportedKeywords,
      attachDiagnostics: diagnostics
    });

    return {
      success: true,
      sessionId: request.sessionId,
      documentId: request.documentId,
      revision: currentRevision,
      overlayId,
      schemaId: request.schemaId,
      diagnostics
    };
  }

  public detach(request: SchemaOverlayDetachRequestDto): SchemaOverlayDetachResultDto {
    const overlay = this.overlaysBySessionId.get(request.sessionId);
    if (overlay === undefined) {
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        diagnostics: [
          createSchemaOverlayDiagnostic(request, {
            category: "schemaNotAttached",
            severity: "warning",
            message: "No schema overlay is attached.",
            recoverability: "none"
          })
        ]
      };
    }

    if (request.overlayId !== undefined && request.overlayId !== overlay.overlayId) {
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        diagnostics: [
          createSchemaOverlayDiagnostic(request, {
            category: "targetNotFound",
            severity: "error",
            overlayId: overlay.overlayId,
            schemaId: overlay.schemaId,
            message: `Schema overlay '${request.overlayId}' is not active for this session.`,
            recoverability: "retry"
          })
        ]
      };
    }

    this.overlaysBySessionId.delete(request.sessionId);
    return {
      success: true,
      sessionId: request.sessionId,
      documentId: request.documentId,
      detachedOverlayId: overlay.overlayId,
      diagnostics: []
    };
  }

  public getMetadata(
    request: SchemaDetailsRequestDto,
    snapshot: PreparedSchemaOverlaySessionSnapshot
  ): SchemaOverlayMetadataResultDto {
    const overlay = this.requireCurrentOverlay(request, snapshot);
    if (overlay.diagnostics.length > 0 || overlay.record === undefined) {
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        revision: request.revision,
        target: request.target,
        diagnostics: overlay.diagnostics
      };
    }

    const record = overlay.record;
    const pathResult = resolvePreparedOverlayTargetPath(request.target, snapshot);
    if (pathResult.diagnostics.length > 0 || pathResult.path === undefined) {
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        revision: request.revision,
        overlayId: record.overlayId,
        target: request.target,
        diagnostics: pathResult.diagnostics.map((diagnostic) => completeDiagnostic(diagnostic, record))
      };
    }

    const resolution = resolvePreparedSchemaForPath(record, pathResult.path);
    const diagnostics = resolution.diagnostics;
    if (resolution.schema === undefined) {
      diagnostics.push(
        createOverlayRecordDiagnostic(record, {
          category: "targetNotFound",
          severity: "warning",
          path: pathResult.path,
          message: `No schema metadata was found for '${pathResult.path}'.`,
          recoverability: "none"
        })
      );
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        revision: request.revision,
        overlayId: record.overlayId,
        target: request.target,
        diagnostics
      };
    }

    return {
      success: true,
      sessionId: request.sessionId,
      documentId: request.documentId,
      revision: request.revision,
      overlayId: record.overlayId,
      target: request.target,
      metadata: createPreparedSchemaNodeMetadata(
        overlay.record,
        resolution.schemaPath,
        resolution.schema,
        resolution.required,
        pathResult.path,
        pathResult.nodeId
      ),
      diagnostics
    };
  }

  public getDetails(
    request: SchemaDetailsRequestDto,
    snapshot: PreparedSchemaOverlaySessionSnapshot
  ): SchemaDetailsResultDto {
    const result = this.getMetadata(request, snapshot);
    return { ...result };
  }

  public getDiagnostics(
    request: SchemaValidationRequestDto,
    snapshot: PreparedSchemaOverlaySessionSnapshot
  ): SchemaValidationResultDto {
    const overlay = this.requireCurrentOverlay(request, snapshot);
    if (overlay.diagnostics.length > 0 || overlay.record === undefined) {
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        revision: request.revision,
        diagnostics: overlay.diagnostics,
        truncated: false
      };
    }

    const maxDiagnostics = Math.max(1, Math.min(500, request.maxDiagnostics));
    const diagnostics: SchemaOverlayDiagnosticDto[] = [];
    const target = request.target;
    const candidateRows =
      target === undefined
        ? (snapshot.rows ?? [])
        : (snapshot.rows ?? []).filter((row) => targetMatchesRow(target, row));

    if ((snapshot.rows === undefined || candidateRows.length === 0) && request.target !== undefined) {
      const metadata = this.getMetadata(
        {
          sessionId: request.sessionId,
          documentId: request.documentId,
          revision: request.revision,
          target: request.target
        },
        snapshot
      );
      diagnostics.push(...metadata.diagnostics);
    }

    for (const row of candidateRows) {
      if (diagnostics.length >= maxDiagnostics) {
        break;
      }
      const path = row.path;
      if (path === undefined) {
        diagnostics.push(
          createOverlayRecordDiagnostic(overlay.record, {
            category: "pathMetadataMissing",
            severity: "warning",
            nodeId: row.nodeId,
            message: `Row ${row.rowIndex} does not include path metadata.`,
            recoverability: "rebuildIndex"
          })
        );
        continue;
      }

      const resolution = resolvePreparedSchemaForPath(overlay.record, path);
      diagnostics.push(...resolution.diagnostics.slice(0, maxDiagnostics - diagnostics.length));
      if (resolution.schema === undefined || diagnostics.length >= maxDiagnostics) {
        continue;
      }

      const value = snapshot.valuesByPath?.[path] ?? parseJsonValueFromPreparedRow(row.text);
      if (value === undefined) {
        continue;
      }

      const metadata = createPreparedSchemaNodeMetadata(
        overlay.record,
        resolution.schemaPath,
        resolution.schema,
        resolution.required,
        path,
        row.nodeId
      );
      collectPreparedValidationDiagnostics(
        diagnostics,
        overlay.record,
        row,
        value,
        metadata,
        resolution.schema,
        maxDiagnostics
      );
    }

    const truncated = diagnostics.length >= maxDiagnostics && candidateRows.length > diagnostics.length;
    if (truncated) {
      diagnostics[diagnostics.length - 1] = createOverlayRecordDiagnostic(overlay.record, {
        category: "validationPartial",
        severity: "warning",
        message: `Schema diagnostics were truncated at ${maxDiagnostics} entries.`,
        recoverability: "retry"
      });
    }

    return {
      success: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
      sessionId: request.sessionId,
      documentId: request.documentId,
      revision: request.revision,
      overlayId: overlay.record.overlayId,
      diagnostics,
      truncated,
      ...(truncated ? { continuationToken: `rows:${candidateRows.length}` } : {})
    };
  }

  public getRowDecorations(
    request: SchemaRowDecorationsRequestDto,
    snapshot: PreparedSchemaOverlaySessionSnapshot
  ): SchemaRowDecorationsResultDto {
    const overlay = this.requireCurrentOverlay(request, snapshot);
    if (overlay.diagnostics.length > 0 || overlay.record === undefined) {
      return {
        success: false,
        sessionId: request.sessionId,
        documentId: request.documentId,
        revision: request.revision,
        decorations: [],
        diagnostics: overlay.diagnostics,
        truncated: false
      };
    }

    const maxDecorations = Math.max(1, Math.min(500, request.maxDecorations));
    const decorations: SchemaRowDecorationDto[] = [];
    const diagnostics: SchemaOverlayDiagnosticDto[] = [];
    for (const row of request.rows) {
      if (decorations.length >= maxDecorations) {
        break;
      }
      const path = row.path;
      if (path === undefined) {
        diagnostics.push(
          createOverlayRecordDiagnostic(overlay.record, {
            category: "pathMetadataMissing",
            severity: "warning",
            nodeId: row.nodeId,
            message: `Row ${row.rowIndex} does not include path metadata.`,
            recoverability: "rebuildIndex"
          })
        );
        continue;
      }
      const resolution = resolvePreparedSchemaForPath(overlay.record, path);
      if (resolution.schema === undefined) {
        continue;
      }
      const metadata = createPreparedSchemaNodeMetadata(
        overlay.record,
        resolution.schemaPath,
        resolution.schema,
        resolution.required,
        path,
        row.nodeId
      );
      const rowDiagnostics: SchemaOverlayDiagnosticDto[] = [];
      const value = snapshot.valuesByPath?.[path] ?? parseJsonValueFromPreparedRow(row.text);
      if (value !== undefined) {
        collectPreparedValidationDiagnostics(
          rowDiagnostics,
          overlay.record,
          row,
          value,
          metadata,
          resolution.schema,
          maxDecorations
        );
      }
      decorations.push({
        rowIndex: row.rowIndex,
        ...(row.nodeId !== undefined ? { nodeId: row.nodeId } : {}),
        path,
        overlayId: overlay.record.overlayId,
        hasMetadata: true,
        hasDiagnostics: rowDiagnostics.length > 0,
        ...(rowDiagnostics.length > 0 ? { severity: highestSchemaSeverity(rowDiagnostics) } : {}),
        markerKinds: createRowMarkerKinds(metadata, rowDiagnostics)
      });
    }

    const truncated = decorations.length >= maxDecorations && request.rows.length > decorations.length;
    return {
      success: true,
      sessionId: request.sessionId,
      documentId: request.documentId,
      revision: request.revision,
      overlayId: overlay.record.overlayId,
      decorations,
      diagnostics,
      truncated
    };
  }

  public getActiveOverlay(sessionId: string): { overlayId: string; schemaId: string; revision: number } | undefined {
    const overlay = this.overlaysBySessionId.get(sessionId);
    return overlay === undefined
      ? undefined
      : { overlayId: overlay.overlayId, schemaId: overlay.schemaId, revision: overlay.revision };
  }

  private requireCurrentOverlay(
    request: { sessionId: string; documentId: string; revision: number },
    snapshot: PreparedSchemaOverlaySessionSnapshot
  ): { record?: PreparedSchemaOverlayRecord | undefined; diagnostics: SchemaOverlayDiagnosticDto[] } {
    const overlay = this.overlaysBySessionId.get(request.sessionId);
    if (overlay === undefined) {
      return {
        diagnostics: [
          createSchemaOverlayDiagnostic(request, {
            category: "schemaNotAttached",
            severity: "warning",
            revision: request.revision,
            message: "No schema overlay is attached.",
            recoverability: "none"
          })
        ]
      };
    }
    if (overlay.documentId !== request.documentId || snapshot.documentId !== request.documentId) {
      return {
        diagnostics: [
          createOverlayRecordDiagnostic(overlay, {
            category: "targetNotFound",
            severity: "error",
            revision: request.revision,
            message: `Schema overlay is attached to document '${overlay.documentId}', not '${request.documentId}'.`,
            recoverability: "retry"
          })
        ]
      };
    }
    if (request.revision !== snapshot.revision || request.revision !== overlay.revision) {
      return {
        diagnostics: [
          createOverlayRecordDiagnostic(overlay, {
            category: "revisionMismatch",
            severity: "error",
            revision: snapshot.revision,
            message: `Schema overlay revision ${overlay.revision} cannot satisfy requested revision ${request.revision}; current revision is ${snapshot.revision}.`,
            recoverability: "retry"
          })
        ]
      };
    }
    return { record: overlay, diagnostics: [] };
  }
}

function getAttachSchema(
  request: SchemaOverlayAttachRequestDto,
  diagnostics: SchemaOverlayDiagnosticDto[],
  revision: number
): JsonObjectDto | undefined {
  if (request.source.kind === "unsupported") {
    diagnostics.push(
      createSchemaOverlayDiagnostic(request, {
        category: "unsupportedOperation",
        severity: "error",
        revision,
        message: `Schema source '${request.source.sourceDescription ?? "unsupported"}' is not supported.`,
        recoverability: "unsupported"
      })
    );
    return undefined;
  }
  const schema = request.source.schema;
  if (!isJsonObjectDto(schema)) {
    diagnostics.push(
      createSchemaOverlayDiagnostic(request, {
        category: "invalidSchema",
        severity: "error",
        revision,
        message: "Schema source must be a JSON object.",
        recoverability: "changeSchema"
      })
    );
    return undefined;
  }
  return schema;
}

function collectUnsupportedSchemaKeywords(schema: JsonObjectDto, schemaPath: string): UnsupportedSchemaKeywordDto[] {
  const result: UnsupportedSchemaKeywordDto[] = [];
  for (const [keyword, value] of Object.entries(schema)) {
    const childSchemaPath = `${schemaPath}/${escapeJsonPointerSegment(keyword)}`;
    if (keyword === "$ref" && typeof value === "string" && !value.startsWith("#")) {
      result.push({
        keyword,
        schemaPath: childSchemaPath,
        classification: "unsupportedReference",
        message: `Reference '${value}' is unsupported; only local same-document references are supported.`
      });
    } else if (UNSUPPORTED_VALIDATION_KEYWORDS.has(keyword)) {
      result.push({
        keyword,
        schemaPath: childSchemaPath,
        classification: "unsupportedValidationKeyword",
        message: `Validation keyword '${keyword}' is not supported by the Layer 2 overlay subset.`
      });
    } else if (IGNORED_ANNOTATION_KEYWORDS.has(keyword)) {
      result.push({
        keyword,
        schemaPath: childSchemaPath,
        classification: "ignoredAnnotation",
        message: `Annotation keyword '${keyword}' is ignored by the Layer 2 overlay.`
      });
    } else if (!SUPPORTED_SCHEMA_KEYWORDS.has(keyword) && !keyword.startsWith("x-")) {
      result.push({
        keyword,
        schemaPath: childSchemaPath,
        classification: "unsupportedValidationKeyword",
        message: `Schema keyword '${keyword}' is not supported by the Layer 2 overlay subset.`
      });
    }
    if (isJsonObjectDto(value)) {
      result.push(...collectUnsupportedSchemaKeywords(value, childSchemaPath));
    } else if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (isJsonObjectDto(entry)) {
          result.push(...collectUnsupportedSchemaKeywords(entry, `${childSchemaPath}/${index}`));
        }
      });
    }
  }
  return result;
}

function resolvePreparedOverlayTargetPath(
  target: SchemaOverlayTargetDto,
  snapshot: PreparedSchemaOverlaySessionSnapshot
): { path?: string | undefined; nodeId?: string | undefined; diagnostics: SchemaOverlayDiagnosticDto[] } {
  if (target.kind === "jsonPointer") {
    return {
      path: target.path.startsWith("$") ? target.path : jsonPointerToStructuralPath(target.path),
      diagnostics: []
    };
  }
  if (target.kind === "node") {
    const path =
      snapshot.nodePathsById?.[target.nodeId] ?? snapshot.rows?.find((row) => row.nodeId === target.nodeId)?.path;
    if (path === undefined) {
      return {
        diagnostics: [
          createSchemaOverlayDiagnostic(snapshot, {
            category: "structuralMetadataMissing",
            severity: "error",
            nodeId: target.nodeId,
            revision: snapshot.revision,
            message: `Node '${target.nodeId}' cannot be mapped to a JSON path.`,
            recoverability: "rebuildIndex"
          })
        ]
      };
    }
    return { path, nodeId: target.nodeId, diagnostics: [] };
  }
  const row = snapshot.rows?.find((entry) => entry.rowIndex === target.rowIndex);
  const path = target.path ?? row?.path;
  const nodeId = target.nodeId ?? row?.nodeId;
  if (path === undefined) {
    return {
      nodeId,
      diagnostics: [
        createSchemaOverlayDiagnostic(snapshot, {
          category: "pathMetadataMissing",
          severity: "error",
          nodeId,
          revision: snapshot.revision,
          message: `Row ${target.rowIndex} does not include JSON path metadata.`,
          recoverability: "rebuildIndex"
        })
      ]
    };
  }
  return { path: path.startsWith("$") ? path : jsonPointerToStructuralPath(path), nodeId, diagnostics: [] };
}

function resolvePreparedSchemaForPath(
  overlay: PreparedSchemaOverlayRecord,
  path: string
): PreparedSchemaResolutionResult {
  let schema: JsonObjectDto | undefined = overlay.schema;
  let schemaPath = "#";
  let required = false;
  const diagnostics: SchemaOverlayDiagnosticDto[] = [];
  const dereferencedRoot = dereferenceLocalSchema(overlay, schema, schemaPath, diagnostics);
  schema = dereferencedRoot.schema;
  schemaPath = dereferencedRoot.schemaPath;

  for (const segment of parseStructuralPath(path)) {
    if (schema === undefined) {
      break;
    }
    const dereferenced = dereferenceLocalSchema(overlay, schema, schemaPath, diagnostics);
    schema = dereferenced.schema;
    schemaPath = dereferenced.schemaPath;
    if (schema === undefined) {
      break;
    }
    if (typeof segment === "number") {
      const items = schema.items;
      if (!isJsonObjectDto(items)) {
        schema = undefined;
        break;
      }
      schema = items;
      schemaPath += "/items";
      required = false;
    } else {
      const properties = schema.properties;
      const propertySchema = isJsonObjectDto(properties) ? properties[segment] : undefined;
      if (!isJsonObjectDto(propertySchema)) {
        schema = undefined;
        break;
      }
      required = parseRequiredProperties(schema.required).includes(segment);
      schema = propertySchema;
      schemaPath += `/properties/${escapeJsonPointerSegment(segment)}`;
    }
  }
  const finalDereferenced =
    schema === undefined
      ? { schema: undefined, schemaPath }
      : dereferenceLocalSchema(overlay, schema, schemaPath, diagnostics);
  return { schema: finalDereferenced.schema, schemaPath: finalDereferenced.schemaPath, required, diagnostics };
}

function dereferenceLocalSchema(
  overlay: PreparedSchemaOverlayRecord,
  schema: JsonObjectDto | undefined,
  schemaPath: string,
  diagnostics: SchemaOverlayDiagnosticDto[]
): { schema?: JsonObjectDto | undefined; schemaPath: string } {
  if (schema === undefined || typeof schema.$ref !== "string") {
    return { schema, schemaPath };
  }
  const ref = schema.$ref;
  if (!ref.startsWith("#")) {
    diagnostics.push(
      createOverlayRecordDiagnostic(overlay, {
        category: "unsupportedReference",
        severity: "warning",
        schemaPath,
        message: `Reference '${ref}' is unsupported; only local same-document references are supported.`,
        recoverability: "unsupported"
      })
    );
    return { schema: undefined, schemaPath };
  }
  const target = readJsonPointer(overlay.schema, ref.slice(1));
  if (!isJsonObjectDto(target)) {
    diagnostics.push(
      createOverlayRecordDiagnostic(overlay, {
        category: "referenceResolutionFailed",
        severity: "error",
        schemaPath,
        message: `Reference '${ref}' could not be resolved to a schema object.`,
        recoverability: "changeSchema"
      })
    );
    return { schema: undefined, schemaPath };
  }
  return { schema: target, schemaPath: ref };
}

function createPreparedSchemaNodeMetadata(
  overlay: PreparedSchemaOverlayRecord,
  schemaPath: string,
  schema: JsonObjectDto,
  required: boolean,
  path?: string | undefined,
  nodeId?: string | undefined
): SchemaNodeMetadataDto {
  const unsupportedKeywords = overlay.unsupportedKeywords.filter((keyword) =>
    keyword.schemaPath.startsWith(schemaPath)
  );
  const metadata: SchemaNodeMetadataDto = {
    schemaPath,
    schemaId: overlay.schemaId,
    ...(nodeId !== undefined ? { nodeId } : {}),
    ...(path !== undefined ? { path } : {})
  };
  if (typeof schema.title === "string") metadata.title = schema.title;
  if (typeof schema.description === "string") metadata.description = schema.description;
  const expectedType = parseSchemaType(schema.type);
  if (expectedType !== undefined) metadata.expectedType = expectedType;
  if (Array.isArray(schema.enum) && schema.enum.every((value) => isJsonValueDto(value)))
    metadata.enumValues = schema.enum.map((value) => cloneJsonValue(value));
  if (schema.const !== undefined && isJsonValueDto(schema.const)) metadata.constValue = cloneJsonValue(schema.const);
  if (required) metadata.required = true;
  if (schema.default !== undefined && isJsonValueDto(schema.default))
    metadata.defaultValue = cloneJsonValue(schema.default);
  const numericConstraints: SchemaNumericConstraintsDto = {};
  if (typeof schema.minimum === "number") numericConstraints.minimum = schema.minimum;
  if (typeof schema.maximum === "number") numericConstraints.maximum = schema.maximum;
  if (Object.keys(numericConstraints).length > 0) metadata.numericConstraints = numericConstraints;
  const stringConstraints: SchemaStringConstraintsDto = {};
  if (typeof schema.minLength === "number") stringConstraints.minLength = schema.minLength;
  if (typeof schema.maxLength === "number") stringConstraints.maxLength = schema.maxLength;
  if (Object.keys(stringConstraints).length > 0) metadata.stringConstraints = stringConstraints;
  const arrayConstraints: SchemaArrayConstraintsDto = {};
  if (typeof schema.minItems === "number") arrayConstraints.minItems = schema.minItems;
  if (typeof schema.maxItems === "number") arrayConstraints.maxItems = schema.maxItems;
  if (Object.keys(arrayConstraints).length > 0) metadata.arrayConstraints = arrayConstraints;
  if (unsupportedKeywords.length > 0) metadata.unsupportedKeywords = unsupportedKeywords;
  return metadata;
}

function collectPreparedValidationDiagnostics(
  diagnostics: SchemaOverlayDiagnosticDto[],
  overlay: PreparedSchemaOverlayRecord,
  row: PreparedRenderRowDto,
  value: JsonValueDto,
  metadata: SchemaNodeMetadataDto,
  schema: JsonObjectDto,
  maxDiagnostics: number
): void {
  const push = (diagnostic: SchemaOverlayDiagnosticDto) => {
    if (diagnostics.length < maxDiagnostics) diagnostics.push(diagnostic);
  };
  const actualType = getSchemaTypeForValue(value);
  const typeExpectation = getPrimitiveTypeExpectation(metadata.expectedType);
  if (
    typeExpectation !== undefined &&
    !typeExpectation.allowedTypes.some((expected) =>
      matchesPrimitiveSchemaType(expected, actualType as "string" | "number" | "integer" | "boolean" | "null")
    )
  ) {
    push(
      createOverlayRecordDiagnostic(overlay, {
        category: "validationFailed",
        severity: "error",
        nodeId: row.nodeId,
        path: row.path,
        schemaPath: metadata.schemaPath,
        message: `Expected type ${formatExpectedType(typeExpectation.expectedType)} but found '${actualType}'.`,
        recoverability: "changeSchema"
      })
    );
  }
  if (Array.isArray(metadata.enumValues) && !metadata.enumValues.some((entry) => areJsonValuesEqual(entry, value))) {
    push(
      createOverlayRecordDiagnostic(overlay, {
        category: "validationFailed",
        severity: "error",
        nodeId: row.nodeId,
        path: row.path,
        schemaPath: metadata.schemaPath,
        message: "Value is not in the allowed enum set.",
        recoverability: "changeSchema"
      })
    );
  }
  if (metadata.constValue !== undefined && !areJsonValuesEqual(metadata.constValue, value)) {
    push(
      createOverlayRecordDiagnostic(overlay, {
        category: "validationFailed",
        severity: "error",
        nodeId: row.nodeId,
        path: row.path,
        schemaPath: metadata.schemaPath,
        message: "Value does not match the schema const value.",
        recoverability: "changeSchema"
      })
    );
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum)
      push(
        createOverlayRecordDiagnostic(overlay, {
          category: "validationFailed",
          severity: "error",
          nodeId: row.nodeId,
          path: row.path,
          schemaPath: metadata.schemaPath,
          message: `Number is less than minimum ${schema.minimum}.`,
          recoverability: "changeSchema"
        })
      );
    if (typeof schema.maximum === "number" && value > schema.maximum)
      push(
        createOverlayRecordDiagnostic(overlay, {
          category: "validationFailed",
          severity: "error",
          nodeId: row.nodeId,
          path: row.path,
          schemaPath: metadata.schemaPath,
          message: `Number is greater than maximum ${schema.maximum}.`,
          recoverability: "changeSchema"
        })
      );
  }
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength)
      push(
        createOverlayRecordDiagnostic(overlay, {
          category: "validationFailed",
          severity: "error",
          nodeId: row.nodeId,
          path: row.path,
          schemaPath: metadata.schemaPath,
          message: `String is shorter than minLength ${schema.minLength}.`,
          recoverability: "changeSchema"
        })
      );
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength)
      push(
        createOverlayRecordDiagnostic(overlay, {
          category: "validationFailed",
          severity: "error",
          nodeId: row.nodeId,
          path: row.path,
          schemaPath: metadata.schemaPath,
          message: `String is longer than maxLength ${schema.maxLength}.`,
          recoverability: "changeSchema"
        })
      );
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems)
      push(
        createOverlayRecordDiagnostic(overlay, {
          category: "validationFailed",
          severity: "error",
          nodeId: row.nodeId,
          path: row.path,
          schemaPath: metadata.schemaPath,
          message: `Array has fewer than minItems ${schema.minItems}.`,
          recoverability: "changeSchema"
        })
      );
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems)
      push(
        createOverlayRecordDiagnostic(overlay, {
          category: "validationFailed",
          severity: "error",
          nodeId: row.nodeId,
          path: row.path,
          schemaPath: metadata.schemaPath,
          message: `Array has more than maxItems ${schema.maxItems}.`,
          recoverability: "changeSchema"
        })
      );
  }
}

function createRowMarkerKinds(
  metadata: SchemaNodeMetadataDto,
  diagnostics: SchemaOverlayDiagnosticDto[]
): SchemaRowMarkerKindDto[] {
  const kinds = new Set<SchemaRowMarkerKindDto>(["schemaMetadata"]);
  if (metadata.description !== undefined) kinds.add("description");
  if (metadata.required === true) kinds.add("required");
  if (metadata.enumValues !== undefined || metadata.constValue !== undefined) kinds.add("enum");
  if (metadata.defaultValue !== undefined) kinds.add("default");
  if (metadata.unsupportedKeywords !== undefined) kinds.add("unsupportedKeyword");
  if (diagnostics.length > 0) kinds.add("validationDiagnostic");
  return [...kinds];
}

function targetMatchesRow(target: SchemaOverlayTargetDto, row: PreparedRenderRowDto): boolean {
  if (target.kind === "row") return row.rowIndex === target.rowIndex;
  if (target.kind === "node") return row.nodeId === target.nodeId;
  const path = target.path.startsWith("$") ? target.path : jsonPointerToStructuralPath(target.path);
  return row.path === path;
}

function parseJsonValueFromPreparedRow(text: string): JsonValueDto | undefined {
  const trimmed = text.trim().replace(/,$/u, "");
  const colon = trimmed.indexOf(":");
  const candidate = colon >= 0 ? trimmed.slice(colon + 1).trim() : trimmed;
  try {
    const value = JSON.parse(candidate) as unknown;
    return isJsonValueDto(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function jsonPointerToStructuralPath(pointer: string): string {
  if (pointer === "" || pointer === "/") return "$";
  const segments = pointer
    .replace(/^#/u, "")
    .split("/")
    .slice(1)
    .map((segment) => segment.replace(/~1/gu, "/").replace(/~0/gu, "~"));
  let path = "$";
  for (const segment of segments) {
    path = /^\d+$/u.test(segment) ? `${path}[${segment}]` : appendObjectPath(path, segment);
  }
  return path;
}

function readJsonPointer(root: JsonObjectDto, pointer: string): unknown {
  if (pointer === "" || pointer === "/") return root;
  let current: unknown = root;
  for (const segment of pointer
    .split("/")
    .slice(1)
    .map((entry) => entry.replace(/~1/gu, "/").replace(/~0/gu, "~"))) {
    if (Array.isArray(current)) {
      current = current[Number(segment)];
    } else if (isJsonObjectDto(current)) {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function createSchemaOverlayDiagnostic(
  request: { sessionId: string; documentId: string },
  values: Omit<Partial<SchemaOverlayDiagnosticDto>, "diagnosticId" | "source" | "sessionId" | "documentId"> & {
    category: SchemaOverlayDiagnosticCategoryDto;
    severity: SchemaOverlayDiagnosticSeverityDto;
    message: string;
  }
): SchemaOverlayDiagnosticDto {
  return {
    diagnosticId: `schema-overlay:${values.category}:${values.path ?? values.nodeId ?? values.schemaPath ?? "session"}`,
    source: "schemaOverlay",
    sessionId: request.sessionId,
    documentId: request.documentId,
    ...values
  };
}

function createOverlayRecordDiagnostic(
  overlay: PreparedSchemaOverlayRecord,
  values: Omit<
    Partial<SchemaOverlayDiagnosticDto>,
    "diagnosticId" | "source" | "sessionId" | "documentId" | "overlayId" | "schemaId"
  > & {
    category: SchemaOverlayDiagnosticCategoryDto;
    severity: SchemaOverlayDiagnosticSeverityDto;
    message: string;
  }
): SchemaOverlayDiagnosticDto {
  return createSchemaOverlayDiagnostic(overlay, {
    revision: overlay.revision,
    overlayId: overlay.overlayId,
    schemaId: overlay.schemaId,
    ...values
  });
}

function completeDiagnostic(
  diagnostic: SchemaOverlayDiagnosticDto,
  overlay: PreparedSchemaOverlayRecord
): SchemaOverlayDiagnosticDto {
  return {
    ...diagnostic,
    overlayId: diagnostic.overlayId ?? overlay.overlayId,
    schemaId: diagnostic.schemaId ?? overlay.schemaId
  };
}

function highestSchemaSeverity(diagnostics: SchemaOverlayDiagnosticDto[]): SchemaOverlayDiagnosticSeverityDto {
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) return "error";
  if (diagnostics.some((diagnostic) => diagnostic.severity === "warning")) return "warning";
  return "info";
}

export { parseTheme, exportTheme } from "./src/theme/themeParser.js";
export type {
  ThemeDocument,
  ThemePluginTokens,
  ThemeDiagnostic,
  ThemeParseResult,
  ThemeExportResult,
  SupportedSchemaVersion,
  SupportedMode
} from "./src/theme/themeParser.js";
