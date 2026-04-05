/** Enable waiting for arbitrary events. Expose a resolve so when the event is fired
 * we call resolve, and anyone with a handle to wait() knows that the event happened */

export class Deferred {
  private _promise: Promise<void> | null = null;
  private _resolve: (() => void) | null = null;
  private _timeout: ReturnType<typeof setTimeout> | null = null;
  private _onSuccess: (() => void) | null = null;

  arm(options?: { timeoutMs: number; onTimeout: () => void; onSuccess: () => void }) {
    this._promise = new Promise<void>((resolve, reject) => {
      this._resolve = resolve;
      if (options?.onSuccess) {
        this._onSuccess = options?.onSuccess;
      }
      if (options !== undefined) {
        this._timeout = setTimeout(() => {
          this.clear();
          options.onTimeout();
          reject(new Error("Deferred timed out"));
        }, options.timeoutMs);
      }
    });
  }

  fire() {
    this._resolve?.();
    this._onSuccess?.();
    this.clear();
  }

  waitFor(): Promise<void> {
    if (!this._promise) {
      throw new Error("Deferred has not been started");
    }
    return this._promise;
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
