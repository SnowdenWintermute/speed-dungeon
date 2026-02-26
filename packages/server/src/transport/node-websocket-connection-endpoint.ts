import { ConnectionEndpoint, ConnectionId } from "@speed-dungeon/common";
import WebSocket from "ws";

export class NodeWebSocketConnectionEndpoint implements ConnectionEndpoint {
  constructor(
    private readonly ws: WebSocket,
    readonly id: ConnectionId
  ) {}

  get readyState(): number {
    return this.ws.readyState;
  }

  on(event: string, listener: (...args: any[]) => void): this {
    this.ws.on(event as any, listener as any);
    return this;
  }

  once(event: string, listener: (...args: any[]) => void): this {
    this.ws.once(event as any, listener as any);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.ws.off(event as any, listener as any);
    return this;
  }

  send(data: string | Uint8Array | ArrayBuffer): void {
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
