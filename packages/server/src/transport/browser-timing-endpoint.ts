import { ConnectionEndpoint, ConnectionId } from "@speed-dungeon/common";

type Listener = (...args: any[]) => void;

export class BrowserTimingConnectionEndpoint implements ConnectionEndpoint {
  private hasOpened = false;
  private pendingMessages: (() => void)[] = [];
  private listenerMap = new Map<string, Map<Listener, Listener>>();
  id: ConnectionId;

  constructor(private readonly inner: ConnectionEndpoint) {
    this.id = inner.id;
  }

  get readyState(): number {
    return this.inner.readyState;
  }

  on(event: string, listener: Listener): this {
    const wrapped = this.wrapListener(event, listener);
    this.track(event, listener, wrapped);
    this.inner.on(event, wrapped);
    return this;
  }

  once(event: string, listener: Listener): this {
    const wrapped = this.wrapListener(event, (...args: any[]) => {
      this.off(event, listener);
      listener(...args);
    });
    this.track(event, listener, wrapped);
    this.inner.once(event, wrapped);
    return this;
  }

  off(event: string, listener: Listener): this {
    const perEvent = this.listenerMap.get(event);
    if (!perEvent) return this;

    const wrapped = perEvent.get(listener);
    if (!wrapped) return this;

    this.inner.off(event, wrapped);
    perEvent.delete(listener);
    if (perEvent.size === 0) this.listenerMap.delete(event);

    return this;
  }

  send(data: string | Uint8Array | ArrayBuffer): void {
    this.inner.send(data);
  }

  close(code?: number, reason?: string): void {
    this.inner.close(code, reason);
  }

  ping(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    this.inner.ping?.(data, mask, callback);
  }

  pong(data?: any, mask?: boolean, callback?: (err?: Error) => void): void {
    this.inner.pong?.(data, mask, callback);
  }

  // -------------------------

  private wrapListener(event: string, listener: Listener): Listener {
    return (...args: any[]) => {
      const task = () => {
        if (event === "open") {
          this.hasOpened = true;
          listener(...args);

          // flush queued messages after open
          const queued = this.pendingMessages;
          this.pendingMessages = [];
          for (const fn of queued) {
            setTimeout(fn, 0);
          }
          return;
        }

        if (event === "message" && !this.hasOpened) {
          this.pendingMessages.push(() => listener(...args));
          return;
        }

        listener(...args);
      };

      // always async, browser-style task queue
      setTimeout(task, 0);
    };
  }

  private track(event: string, original: Listener, wrapped: Listener): void {
    let perEvent = this.listenerMap.get(event);
    if (!perEvent) {
      perEvent = new Map();
      this.listenerMap.set(event, perEvent);
    }
    perEvent.set(original, wrapped);
  }
}
