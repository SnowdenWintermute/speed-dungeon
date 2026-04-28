import { ConnectionId } from "../aliases.js";
import { ConnectionEndpoint, ConnectionEndpointReadyState } from "./connection-endpoint.js";

export class BrowserWebSocketConnectionEndpoint implements ConnectionEndpoint {
  private ws: WebSocket;
  private listenerAdapters = new Map<string, Map<(...args: any[]) => void, EventListener>>();

  constructor(
    ws: WebSocket,
    public readonly id: ConnectionId
  ) {
    this.ws = ws;
    this.ws.binaryType = "arraybuffer";
  }

  get readyState(): ConnectionEndpointReadyState {
    return this.ws.readyState;
  }

  on(event: "open", listener: () => void): this;
  on(event: "message", listener: (data: string | ArrayBuffer) => void): this;
  on(event: "close", listener: (code: number, reason: string) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "ping", listener: (data: Uint8Array) => void): this;
  on(event: "pong", listener: (data: Uint8Array) => void): this;
  on(event: string, listener: (...args: any[]) => void): this {
    if (event === "ping" || event === "pong") {
      return this;
    }

    const adapter: EventListener = (e: Event) => {
      this.dispatchToListener(event, listener, e);
    };

    this.trackAdapter(event, listener, adapter);
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
    if (event === "ping" || event === "pong") {
      return this;
    }

    const adapter: EventListener = (e: Event) => {
      this.untrackAdapter(event, listener);
      this.dispatchToListener(event, listener, e);
    };

    this.trackAdapter(event, listener, adapter);
    this.ws.addEventListener(event, adapter, { once: true });
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    const perEvent = this.listenerAdapters.get(event);
    if (!perEvent) return this;
    const adapter = perEvent.get(listener);
    if (!adapter) return this;
    this.ws.removeEventListener(event, adapter);
    perEvent.delete(listener);
    if (perEvent.size === 0) this.listenerAdapters.delete(event);
    return this;
  }

  send(data: string | Uint8Array | ArrayBuffer): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    try {
      this.ws.close(code, reason);
    } catch {
      this.ws.close();
    }
  }

  ping(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    callback?.();
  }

  pong(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    callback?.();
  }

  private dispatchToListener(event: string, listener: (...args: any[]) => void, e: Event): void {
    if (event === "message") {
      const msgEvent = e as MessageEvent;
      listener(msgEvent.data);
    } else if (event === "close") {
      const closeEvent = e as CloseEvent;
      listener(closeEvent.code, closeEvent.reason);
    } else if (event === "error") {
      const errorEvent = e as ErrorEvent;
      const message = errorEvent.message || "WebSocket error";
      listener(new Error(message));
    } else {
      listener(e);
    }
  }

  private trackAdapter(
    event: string,
    listener: (...args: any[]) => void,
    adapter: EventListener
  ): void {
    let perEvent = this.listenerAdapters.get(event);
    if (!perEvent) {
      perEvent = new Map();
      this.listenerAdapters.set(event, perEvent);
    }
    perEvent.set(listener, adapter);
  }

  private untrackAdapter(event: string, listener: (...args: any[]) => void): void {
    const perEvent = this.listenerAdapters.get(event);
    if (!perEvent) return;
    perEvent.delete(listener);
    if (perEvent.size === 0) this.listenerAdapters.delete(event);
  }
}
