export const RUNTIME_PROTOCOL_VERSION = "0.2.0-milestone-002";

export type JsonContentType = "application/json";
export type DocumentSessionLifecycleState = "created" | "mounted" | "document-loaded" | "disposed";

export interface RuntimeOptionsDto {
  placeholderText?: string;
}

export interface CreateSessionCommand {
  hostElementId: string;
  sessionId: string;
  options?: RuntimeOptionsDto;
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

export interface ViewportDto {
  width: number;
  height: number;
}

export interface DocumentSessionRecord {
  sessionId: string;
  hostElementId: string;
  lifecycleState: DocumentSessionLifecycleState;
  options?: RuntimeOptionsDto;
  documentId?: string;
  text?: string;
  contentType?: JsonContentType;
  viewport?: ViewportDto;
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

export type RuntimeEventDto =
  | SessionCreatedEventDto
  | SessionDisposedEventDto
  | RuntimeErrorEventDto
  | PlaceholderEventDto;

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
    return this.updateSession(command.sessionId, (session) => ({
      ...session,
      contentType: command.contentType,
      documentId: command.documentId,
      lifecycleState: "document-loaded",
      text: command.text
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
