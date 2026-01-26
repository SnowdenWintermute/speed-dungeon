import { ConnectionId } from "../aliases.js";
import { BaseEmitter } from "./base-emitter.js";
import { ConnectionEndpoint, ConnectionEndpointReadyState } from "./connection-endpoint.js";

// we are using a custom "BaseEmitter" in place of EventEmitter since that is not available
// in browser runtime, but I like the syntax of node ws library EventEmitter WebSocket
export class InMemoryConnectionEndpoint extends BaseEmitter implements ConnectionEndpoint {
  readyState: ConnectionEndpointReadyState = ConnectionEndpointReadyState.CONNECTING;

  private peer?: InMemoryConnectionEndpoint;

  constructor(readonly id: ConnectionId) {
    super();
    this.triggerOpen();
  }

  setPeer(peer: InMemoryConnectionEndpoint): void {
    this.peer = peer;
  }

  /** Emit 'open' asynchronously, matching node "ws" WebSocket timing.
      This is slightly different than browser's WebSocket timing which uses a Macrotask or just "task" */
  triggerOpen(): void {
    queueMicrotask(() => {
      if (this.readyState === ConnectionEndpointReadyState.CONNECTING) {
        this.readyState = ConnectionEndpointReadyState.OPEN;
        this.emit("open");
      }
    });
  }

  /** Async delivery to peer to ensure timing expectations in tests */
  send(data: string | ArrayBuffer, callback?: (err?: Error) => void): void {
    if (this.readyState !== ConnectionEndpointReadyState.OPEN) {
      callback?.(
        new Error("InMemoryConnectionEndpoint is not open: readyState " + this.readyState)
      );
      return;
    }

    queueMicrotask(() => {
      if (this.peer && this.peer.readyState === ConnectionEndpointReadyState.OPEN) {
        this.peer.emit("message", data);
      }
    });
  }

  close(code: number = 1000, reason: string = ""): void {
    const closingStates = [
      ConnectionEndpointReadyState.CLOSING,
      ConnectionEndpointReadyState.CLOSED,
    ];

    if (closingStates.includes(this.readyState)) {
      return;
    }

    this.readyState = ConnectionEndpointReadyState.CLOSING;

    queueMicrotask(() => {
      this.readyState = ConnectionEndpointReadyState.CLOSED;
      this.emit("close", code, reason);

      if (this.peer === undefined) {
        return;
      }

      const peerStillOpen = this.peer.readyState !== ConnectionEndpointReadyState.CLOSED;
      if (peerStillOpen) {
        // Queue peer close separately to simulate network delay
        queueMicrotask(() => {
          if (this.peer === undefined) {
            return;
          }
          this.peer.readyState = ConnectionEndpointReadyState.CLOSED;
          this.peer.emit("close", code, reason);
        });
      }
    });
  }

  ping(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    if (this.readyState !== ConnectionEndpointReadyState.OPEN) {
      callback?.(new Error("InMemoryConnectionEndpoint is not open"));
      return;
    }

    queueMicrotask(() => {
      if (this.peer && this.peer.readyState === ConnectionEndpointReadyState.OPEN) {
        const buffer = data ?? new Uint8Array(0);
        this.peer.emit("ping", buffer);
        this.peer.pong(buffer, mask, () => {
          // no-op
        });
      }
      callback?.();
    });
  }

  pong(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    if (this.readyState !== ConnectionEndpointReadyState.OPEN) {
      callback?.(new Error("WebSocket is not open"));
      return;
    }

    queueMicrotask(() => {
      if (this.peer && this.peer.readyState === ConnectionEndpointReadyState.OPEN) {
        const buffer = data ?? new Uint8Array(0);
        this.peer.emit("pong", buffer);
      }
      callback?.();
    });
  }

  // ping(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
  //   if (this.readyState !== ConnectionEndpointReadyState.OPEN) {
  //     callback?.(new Error("InMemoryConnectionEndpoint is not open"));
  //     return;
  //   }

  //   queueMicrotask(() => {
  //     if (this.peer && this.peer.readyState === ConnectionEndpointReadyState.OPEN) {
  //       const buffer = data ? Buffer.from(data) : Buffer.alloc(0);
  //       this.peer.emit("ping", buffer);
  //       // Auto-respond with pong (like real WebSocket)
  //       this.peer.pong(buffer, mask, () => {
  //         // no-op
  //       });
  //     }
  //     callback?.();
  //   });
  // }

  // pong(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
  //   if (this.readyState !== ConnectionEndpointReadyState.OPEN) {
  //     callback?.(new Error("WebSocket is not open"));
  //     return;
  //   }

  //   queueMicrotask(() => {
  //     if (this.peer && this.peer.readyState === ConnectionEndpointReadyState.OPEN) {
  //       const buffer = data ? Buffer.from(data) : Buffer.alloc(0);
  //       this.peer.emit("pong", buffer); // emit doesnt't exist
  //     }
  //     callback?.();
  //   });
  // }

  on(event: "open", listener: () => void): this;
  on(event: "message", listener: (data: string | ArrayBuffer) => void): this;
  on(event: "close", listener: (code: number, reason: string) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "ping", listener: (data: Buffer) => void): this;
  on(event: "pong", listener: (data: Buffer) => void): this;
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener); // super can only be referenced in a derived class
  }

  once(event: "open", listener: () => void): this;
  once(event: "message", listener: (data: string | ArrayBuffer) => void): this;
  once(event: "close", listener: (code: number, reason: string) => void): this;
  once(event: "error", listener: (error: Error) => void): this;
  once(event: "ping", listener: (data: Buffer) => void): this;
  once(event: "pong", listener: (data: Buffer) => void): this;
  once(event: string, listener: (...args: any[]) => void): this {
    return super.once(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }
}
