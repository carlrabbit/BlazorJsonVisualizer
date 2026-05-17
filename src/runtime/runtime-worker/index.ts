import { RUNTIME_PROTOCOL_VERSION } from "../runtime-core/index.js";

export const RUNTIME_WORKER_PLACEHOLDER = "Milestone 002 worker entry point placeholder";

export function getRuntimeWorkerProtocolVersion(): string {
  return RUNTIME_PROTOCOL_VERSION;
}
