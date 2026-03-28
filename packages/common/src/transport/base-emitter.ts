type Listener = (...args: any[]) => void;

export class BaseEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return this;
  }

  once(event: string, listener: Listener): this {
    const wrapped: Listener = (...args) => {
      this.off(event, wrapped);
      listener(...args);
    };
    return this.on(event, wrapped);
  }

  off(event: string, listener: Listener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  protected emit(event: string, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (!set) return;

    // Copy to allow mutation during dispatch, matching EventEmitter semantics
    for (const listener of [...set]) {
      listener(...args);
    }
  }
}
