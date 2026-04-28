import { ConnectionEndpoint, ConnectionId } from "@speed-dungeon/common";
import WebSocket, { RawData } from "ws";

type Adapter = (...args: any[]) => void;

export class NodeWebSocketConnectionEndpoint implements ConnectionEndpoint {
  private listenerAdapters = new Map<string, Map<(...args: any[]) => void, Adapter>>();

  constructor(
    private readonly ws: WebSocket,
    readonly id: ConnectionId
  ) {
    this.ws.binaryType = "arraybuffer";
  }

  get readyState(): number {
    return this.ws.readyState;
  }

  on(event: string, listener: (...args: any[]) => void): this {
    const adapter: Adapter = (...args: any[]) => {
      this.dispatchToListener(event, listener, args);
    };
    this.trackAdapter(event, listener, adapter);
    this.ws.on(event as any, adapter);
    return this;
  }

  once(event: string, listener: (...args: any[]) => void): this {
    const adapter: Adapter = (...args: any[]) => {
      this.untrackAdapter(event, listener);
      this.dispatchToListener(event, listener, args);
    };
    this.trackAdapter(event, listener, adapter);
    this.ws.once(event as any, adapter);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    const perEvent = this.listenerAdapters.get(event);
    if (!perEvent) return this;
    const adapter = perEvent.get(listener);
    if (!adapter) return this;
    this.ws.off(event as any, adapter);
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
    this.ws.ping(data, mask, callback);
  }

  pong(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    this.ws.pong(data, mask, callback);
  }

  private dispatchToListener(
    event: string,
    listener: (...args: any[]) => void,
    args: any[]
  ): void {
    if (event === "message") {
      const data = args[0] as RawData;
      const isBinary = args[1] as boolean;
      listener(normalizeMessageData(data, isBinary));
    } else if (event === "close") {
      const code = args[0] as number;
      const reason = args[1];
      listener(code, normalizeCloseReason(reason));
    } else {
      listener(...args);
    }
  }

  private trackAdapter(
    event: string,
    listener: (...args: any[]) => void,
    adapter: Adapter
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

function normalizeMessageData(data: RawData, isBinary: boolean): string | ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return isBinary ? data : new TextDecoder().decode(data);
  }
  if (Buffer.isBuffer(data)) {
    return isBinary ? bufferToArrayBuffer(data) : data.toString("utf8");
  }
  const merged = Buffer.concat(data);
  return isBinary ? bufferToArrayBuffer(merged) : merged.toString("utf8");
}

function bufferToArrayBuffer(buf: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}

function normalizeCloseReason(reason: unknown): string {
  if (typeof reason === "string") return reason;
  if (Buffer.isBuffer(reason)) return reason.toString("utf8");
  return "";
}
