import { ConnectionId } from "../aliases.js";

export enum ConnectionEndpointReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export interface ConnectionEndpoint {
  id: ConnectionId;
  readyState: ConnectionEndpointReadyState;

  on(event: "open", listener: () => void): this;
  on(event: "message", listener: (data: string | Buffer | ArrayBuffer) => void): this;
  on(event: "close", listener: (code: number, reason: string) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "ping", listener: (data: Buffer) => void): this;
  on(event: "pong", listener: (data: Buffer) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;

  once(event: "open", listener: () => void): this;
  once(event: "message", listener: (data: string | Buffer | ArrayBuffer) => void): this;
  once(event: "close", listener: (code: number, reason: string) => void): this;
  once(event: "error", listener: (error: Error) => void): this;
  once(event: "ping", listener: (data: Buffer) => void): this;
  once(event: "pong", listener: (data: Buffer) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;

  off(event: string, listener: (...args: any[]) => void): this;

  send(data: string | Buffer | ArrayBuffer): void;
  close(code?: number, reason?: string): void;

  ping(data?: any, mask?: boolean, callback?: (err?: Error) => void): void;
  pong(data?: any, mask?: boolean, callback?: (err?: Error) => void): void;
}
