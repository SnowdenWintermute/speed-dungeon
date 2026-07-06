import { makeAutoObservable } from "mobx";

/** Enable waiting for arbitrary events. Expose a resolve so when the event is fired
 * we call resolve, and anyone with a handle to wait() knows that the event happened */
export class Deferred {
  private _promise: Promise<void> | null = null;
  private _resolve: (() => void) | null = null;
  private _timeout: ReturnType<typeof setTimeout> | null = null;
  private _onSuccess: (() => void) | null = null;
  private completed = false;
  private _readyWaiters: (() => void)[] = [];

  constructor(private _name: string) {}

  makeObservable() {
    makeAutoObservable(this);
  }

  arm(options?: { timeoutMs: number; onTimeout: () => void; onSuccess: () => void }) {
    this.completed = false;
    this._promise = new Promise<void>((resolve, reject) => {
      this._resolve = resolve;
      if (options?.onSuccess) {
        this._onSuccess = options?.onSuccess;
      }
      if (options !== undefined) {
        this._timeout = setTimeout(() => {
          this.clear();
          options.onTimeout();
          reject(new Error(`Deferred timed out (${this._name})`));
        }, options.timeoutMs);
      }
    });
    this.notifyReadyWaiters();
  }

  fire() {
    this._resolve?.();
    this._onSuccess?.();
    this.clear();
    this.completed = true;
  }

  isArmed() {
    return this._promise !== null;
  }

  waitFor(): Promise<void> {
    // if (!this._promise) {
    //   throw new Error("Deferred has not been started");
    // }
    if (!this._promise) {
      return Promise.reject(new Error("Deferred has not been started"));
    }

    return this._promise;
  }

  waitForOrCompleted(): Promise<void> {
    if (this.completed) return Promise.resolve();
    return this.waitFor();
  }

  waitForStartedOrCompleted(): Promise<void> {
    if (this.isArmed() || this.completed) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this._readyWaiters.push(resolve);
    });
  }

  private notifyReadyWaiters() {
    const waiters = this._readyWaiters;
    this._readyWaiters = [];
    for (const resolver of waiters) resolver();
  }

  private clear() {
    this._promise = null;
    this._resolve = null;
    if (this._timeout !== null) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
  }
}
