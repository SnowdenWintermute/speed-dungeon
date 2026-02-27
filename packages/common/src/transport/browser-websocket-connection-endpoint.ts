import { ConnectionId } from "../aliases.js";
import { ConnectionEndpoint, ConnectionEndpointReadyState } from "./connection-endpoint.js";

export class BrowserWebSocketConnectionEndpoint implements ConnectionEndpoint {
  private ws: WebSocket;
  // Map from original listener to adapter function
  private listenerAdapters = new Map<(...args: any[]) => void, EventListener>();

  constructor(
    ws: WebSocket,
    public readonly id: ConnectionId
  ) {
    this.ws = ws;
  }

  get readyState(): ConnectionEndpointReadyState {
    return this.ws.readyState;
  }

  // Event handlers - adapt EventTarget to EventEmitter-style API
  on(event: "open", listener: () => void): this;
  on(event: "message", listener: (data: string | ArrayBuffer) => void): this;
  on(event: "close", listener: (code: number, reason: string) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "ping", listener: (data: Uint8Array) => void): this;
  on(event: "pong", listener: (data: Uint8Array) => void): this;
  on(event: string, listener: (...args: any[]) => void): this {
    // Ping/pong are noops in browser
    if (event === "ping" || event === "pong") {
      return this;
    }

    // Create and store adapter function
    const adapter: EventListener = (e: Event) => {
      if (event === "message") {
        const msgEvent = e as MessageEvent;
        listener(msgEvent.data);
      } else if (event === "close") {
        const closeEvent = e as CloseEvent;
        listener(closeEvent.code, closeEvent.reason);
      } else if (event === "error") {
        listener(new Error("WebSocket error"));
      } else {
        listener(e);
      }
    };

    this.listenerAdapters.set(listener, adapter);
    this.ws.addEventListener(event, adapter);
    return this;
  }

  once(event: "open", listener: () => void): this;
  once(event: "message", listener: (data: string | ArrayBuffer) => void): this;
  once(event: "close", listener: (code: number, reason: string) => void): this;
  once(event: "error", listener: (error: Error) => void): this;
  once(event: "ping", listener: (data: Uint8Array) => void): this;
  once(event: "pong", listener: (data: Uint8Array) => void): this;
  once(event: string, listener: (...args: any[]) => void): this {
    // Ping/pong are noops in browser
    if (event === "ping" || event === "pong") {
      return this;
    }

    const adapter: EventListener = (e: Event) => {
      if (event === "message") {
        const msgEvent = e as MessageEvent;
        listener(msgEvent.data);
      } else if (event === "close") {
        const closeEvent = e as CloseEvent;
        listener(closeEvent.code, closeEvent.reason);
      } else if (event === "error") {
        listener(new Error("WebSocket error"));
      } else {
        listener(e);
      }
    };

    this.ws.addEventListener(event, adapter, { once: true });
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    const adapter = this.listenerAdapters.get(listener);
    if (adapter) {
      this.ws.removeEventListener(event, adapter);
      this.listenerAdapters.delete(listener);
    }
    return this;
  }

  // Core methods
  send(data: string | Uint8Array | ArrayBuffer): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    console.log("closing browser WebSocket");
    this.ws.close(code, reason);
  }

  // Ping/pong are noops - browser handles this at protocol level
  ping(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    callback?.();
  }

  pong(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    callback?.();
  }
}
