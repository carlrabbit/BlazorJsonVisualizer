export declare const RUNTIME_PROTOCOL_VERSION = "0.2.0-milestone-002";
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
export type RuntimeEventDto = SessionCreatedEventDto | SessionDisposedEventDto | RuntimeErrorEventDto | PlaceholderEventDto;
export declare class SessionRegistry {
    private readonly sessions;
    createSession(command: CreateSessionCommand): DocumentSessionRecord;
    mountSession(sessionId: string): DocumentSessionRecord;
    loadTextDocument(command: LoadTextDocumentCommand): DocumentSessionRecord;
    setViewport(command: SetViewportCommand): DocumentSessionRecord;
    disposeSession(command: DisposeSessionCommand): DocumentSessionRecord;
    getSession(sessionId: string): DocumentSessionRecord | undefined;
    listSessionIds(): string[];
    private updateSession;
    private requireSession;
}
