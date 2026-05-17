import {
  type ApplyTransactionCommand,
  RUNTIME_PROTOCOL_VERSION,
  type CreateSessionCommand,
  type DisposeSessionCommand,
  type LoadTextDocumentCommand,
  type RedoCommand,
  type RevealPathCommand,
  type RuntimeEventDto,
  type SetViewportCommand,
  type ToggleFoldCommand,
  type UndoCommand
} from "../runtime-core/index.js";
import { createDomRuntimeController } from "../runtime-dom/index.js";

export interface DotNetCallbackTarget {
  invokeMethodAsync(methodName: string, event: RuntimeEventDto): Promise<unknown>;
}

export interface RuntimeBlazorModule {
  createSession(command: CreateSessionCommand, callbackTarget?: DotNetCallbackTarget): Promise<void>;
  disposeSession(command: DisposeSessionCommand): Promise<void>;
  getRuntimeProtocolVersion(): string;
  loadTextDocument(command: LoadTextDocumentCommand): Promise<void>;
  setViewport(command: SetViewportCommand): Promise<void>;
  toggleFold(command: ToggleFoldCommand): Promise<void>;
  revealPath(command: RevealPathCommand): Promise<void>;
  applyTransaction(command: ApplyTransactionCommand): Promise<void>;
  undo(command: UndoCommand): Promise<void>;
  redo(command: RedoCommand): Promise<void>;
}

const domRuntimeController = createDomRuntimeController();

export async function createSession(
  command: CreateSessionCommand,
  callbackTarget?: DotNetCallbackTarget
): Promise<void> {
  await domRuntimeController.createSession(command, createCallback(callbackTarget));
}

export async function disposeSession(command: DisposeSessionCommand): Promise<void> {
  await domRuntimeController.disposeSession(command);
}

export async function loadTextDocument(command: LoadTextDocumentCommand): Promise<void> {
  await domRuntimeController.loadTextDocument(command);
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
