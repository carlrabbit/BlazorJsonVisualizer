import {
  type AttachSchemaCommand,
  type ApplyTransactionCommand,
  type CreateProjectionCommand,
  RUNTIME_PROTOCOL_VERSION,
  type CreateSessionCommand,
  type DisposeProjectionCommand,
  type DetachSchemaCommand,
  type DisposeSessionCommand,
  type GetSchemaMetadataForPathCommand,
  type PreparedEditCommandDto,
  type PreparedEditResultDto,
  type PreparedOpenRequestDto,
  type PreparedRevealRequestDto,
  type PreparedRevealResultDto,
  type PreparedSearchRequestDto,
  type PreparedSearchResultPageDto,
  type SelectProjectionItemCommand,
  type LoadTextDocumentCommand,
  type RedoCommand,
  type RevealPathCommand,
  type RuntimeEventDto,
  type SchemaNodeMetadataDto,
  type SetViewportCommand,
  type ToggleFoldCommand,
  type UndoCommand
} from "../runtime-core/index.js";
import { createDomRuntimeController } from "../runtime-dom/index.js";
import { PreparedDocumentHost } from "./src/preparedDocumentHost.js";

export interface DotNetCallbackTarget {
  invokeMethodAsync(methodName: string, event: RuntimeEventDto): Promise<unknown>;
}

export interface RuntimeBlazorModule {
  createSession(command: CreateSessionCommand, callbackTarget?: DotNetCallbackTarget): Promise<void>;
  disposeSession(command: DisposeSessionCommand): Promise<void>;
  getRuntimeProtocolVersion(): string;
  loadTextDocument(command: LoadTextDocumentCommand): Promise<void>;
  openPreparedDocumentSession(request: PreparedOpenRequestDto): Promise<void>;
  searchPreparedDocument(request: PreparedSearchRequestDto): Promise<PreparedSearchResultPageDto>;
  revealPreparedLocation(request: PreparedRevealRequestDto): Promise<PreparedRevealResultDto>;
  applyPreparedEdit(command: PreparedEditCommandDto): Promise<PreparedEditResultDto>;
  closePreparedDocumentSession(sessionId: string): Promise<void>;
  createProjection(command: CreateProjectionCommand): Promise<void>;
  disposeProjection(command: DisposeProjectionCommand): Promise<void>;
  selectProjectionItem(command: SelectProjectionItemCommand): Promise<void>;
  attachSchema(command: AttachSchemaCommand): Promise<void>;
  detachSchema(command: DetachSchemaCommand): Promise<void>;
  getSchemaMetadataForPath(command: GetSchemaMetadataForPathCommand): Promise<SchemaNodeMetadataDto | undefined>;
  setViewport(command: SetViewportCommand): Promise<void>;
  toggleFold(command: ToggleFoldCommand): Promise<void>;
  revealPath(command: RevealPathCommand): Promise<void>;
  applyTransaction(command: ApplyTransactionCommand): Promise<void>;
  undo(command: UndoCommand): Promise<void>;
  redo(command: RedoCommand): Promise<void>;
}

const domRuntimeController = createDomRuntimeController();
const preparedDocumentHost = new PreparedDocumentHost();

export async function createSession(
  command: CreateSessionCommand,
  callbackTarget?: DotNetCallbackTarget
): Promise<void> {
  await domRuntimeController.createSession(command, createCallback(callbackTarget));
  preparedDocumentHost.registerSession(command, callbackTarget);
}

export async function disposeSession(command: DisposeSessionCommand): Promise<void> {
  await preparedDocumentHost.unregisterSession(command.sessionId);
  await domRuntimeController.disposeSession(command);
}

export async function loadTextDocument(command: LoadTextDocumentCommand): Promise<void> {
  await domRuntimeController.loadTextDocument(command);
}

export async function openPreparedDocumentSession(request: PreparedOpenRequestDto): Promise<void> {
  await preparedDocumentHost.openPreparedDocumentSession(request);
}

export async function searchPreparedDocument(request: PreparedSearchRequestDto): Promise<PreparedSearchResultPageDto> {
  return preparedDocumentHost.searchPreparedDocument(request);
}

export async function revealPreparedLocation(request: PreparedRevealRequestDto): Promise<PreparedRevealResultDto> {
  return preparedDocumentHost.revealPreparedLocation(request);
}

export async function applyPreparedEdit(command: PreparedEditCommandDto): Promise<PreparedEditResultDto> {
  return preparedDocumentHost.applyPreparedEdit(command);
}

export async function closePreparedDocumentSession(sessionId: string): Promise<void> {
  await preparedDocumentHost.closePreparedDocumentSession(sessionId);
}

export async function createProjection(command: CreateProjectionCommand): Promise<void> {
  await domRuntimeController.createProjection(command);
}

export async function disposeProjection(command: DisposeProjectionCommand): Promise<void> {
  await domRuntimeController.disposeProjection(command);
}

export async function selectProjectionItem(command: SelectProjectionItemCommand): Promise<void> {
  await domRuntimeController.selectProjectionItem(command);
}

export async function attachSchema(command: AttachSchemaCommand): Promise<void> {
  await domRuntimeController.attachSchema(command);
}

export async function detachSchema(command: DetachSchemaCommand): Promise<void> {
  await domRuntimeController.detachSchema(command);
}

export async function getSchemaMetadataForPath(
  command: GetSchemaMetadataForPathCommand
): Promise<SchemaNodeMetadataDto | undefined> {
  return domRuntimeController.getSchemaMetadataForPath(command);
}

export async function setViewport(command: SetViewportCommand): Promise<void> {
  await domRuntimeController.setViewport(command);
}

export async function toggleFold(command: ToggleFoldCommand): Promise<void> {
  await domRuntimeController.toggleFold(command);
}

export async function revealPath(command: RevealPathCommand): Promise<void> {
  await domRuntimeController.revealPath(command);
}

export async function applyTransaction(command: ApplyTransactionCommand): Promise<void> {
  await domRuntimeController.applyTransaction(command);
}

export async function undo(command: UndoCommand): Promise<void> {
  await domRuntimeController.undo(command);
}

export async function redo(command: RedoCommand): Promise<void> {
  await domRuntimeController.redo(command);
}

export function getRuntimeProtocolVersion(): string {
  return RUNTIME_PROTOCOL_VERSION;
}

function createCallback(callbackTarget?: DotNetCallbackTarget) {
  if (callbackTarget === undefined) {
    return undefined;
  }

  return async (event: RuntimeEventDto): Promise<void> => {
    await callbackTarget.invokeMethodAsync("HandleRuntimeEvent", event);
  };
}

const runtimeBlazorModule: RuntimeBlazorModule = {
  createSession,
  disposeSession,
  getRuntimeProtocolVersion,
  loadTextDocument,
  openPreparedDocumentSession,
  searchPreparedDocument,
  revealPreparedLocation,
  closePreparedDocumentSession,
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

declare global {
  interface Window {
    BlazorJsonVisualizerRuntime?: RuntimeBlazorModule;
  }
}
