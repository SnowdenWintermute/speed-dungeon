import WebSocket from "ws";
import { ConnectionEndpoint } from "./connection-endpoint.js";
import { ConnectionId } from "../aliases.js";

export class NodeWebSocketConnectionEndpoint implements ConnectionEndpoint {
  private ws: WebSocket;

  constructor(
    ws: WebSocket,
    public readonly id: ConnectionId
  ) {
    this.ws = ws;
  }

  get readyState(): number {
    return this.ws.readyState;
  }

  on(event: "open", listener: () => void): this;
  on(event: "message", listener: (data: string | Buffer | ArrayBuffer) => void): this;
  on(event: "close", listener: (code: number, reason: string) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "ping", listener: (data: Buffer) => void): this;
  on(event: "pong", listener: (data: Buffer) => void): this;
  on(event: string, listener: (...args: any[]) => void): this {
    if (event === "close") {
      // Adapt: ws emits (code, reason: Buffer), we want (code, reason: string)
      this.ws.on("close", (code: number, reason: Buffer) => {
        (listener as any)(code, reason.toString());
      });
    } else {
      this.ws.on(event as any, listener as any);
    }
    return this;
  }

  once(event: "open", listener: () => void): this;
  once(event: "message", listener: (data: string | Buffer | ArrayBuffer) => void): this;
  once(event: "close", listener: (code: number, reason: string) => void): this;
  once(event: "error", listener: (error: Error) => void): this;
  once(event: "ping", listener: (data: Buffer) => void): this;
  once(event: "pong", listener: (data: Buffer) => void): this;
  once(event: string, listener: (...args: any[]) => void): this {
    if (event === "close") {
      // Adapt: ws emits (code, reason: Buffer), we want (code, reason: string)
      this.ws.once("close", (code: number, reason: Buffer) => {
        (listener as any)(code, reason.toString());
      });
    } else {
      this.ws.once(event as any, listener as any);
    }
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.ws.off(event as any, listener as any);
    return this;
  }

  send(data: string | Buffer | ArrayBuffer): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
  }

  ping(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    this.ws.ping(data, mask, callback);
  }

  pong(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    this.ws.pong(data, mask, callback);
  }
}
