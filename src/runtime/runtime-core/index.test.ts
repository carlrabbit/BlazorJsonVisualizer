import { RUNTIME_PROTOCOL_VERSION, SessionRegistry } from "./index.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(action: () => void, message: string): void {
  let threw = false;

  try {
    action();
  } catch {
    threw = true;
  }

  assert(threw, message);
}

function sessionRegistryTracksCreateAndDispose(): void {
  const registry = new SessionRegistry();
  const session = registry.createSession({
    hostElementId: "host-1",
    options: {
      placeholderText: "Placeholder runtime"
    },
    sessionId: "session-1"
  });

  assert(session.lifecycleState === "created", "session should start in the created state");
  assert(registry.listSessionIds().length === 1, "registry should contain a created session");

  registry.mountSession("session-1");
  registry.loadTextDocument({
    contentType: "application/json",
    documentId: "document-1",
    sessionId: "session-1",
    text: "{\"hello\":\"world\"}"
  });
  registry.disposeSession({ sessionId: "session-1" });

  assert(registry.getSession("session-1") === undefined, "disposed sessions should be removed from the registry");
  assertThrows(
    () => registry.setViewport({ height: 100, sessionId: "session-1", width: 120 }),
    "disposed sessions should reject further commands"
  );
}

function runtimeProtocolVersionIsExported(): void {
  assert(RUNTIME_PROTOCOL_VERSION.length > 0, "protocol version should be a non-empty string");
}

sessionRegistryTracksCreateAndDispose();
runtimeProtocolVersionIsExported();
