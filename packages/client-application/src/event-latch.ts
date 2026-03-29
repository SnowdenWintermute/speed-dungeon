import { Milliseconds } from "@speed-dungeon/common";
import isMatch from "lodash.ismatch";

/** used for awaiting game updates containing certain fields being done processing so button loading
 * states can be cleared or tests can assert state after processing completes */
export class ProcessedUpdateAwaiter<T extends object> {
  private awaiting: { partial: Partial<T>; resolver: () => void }[] = [];
  private timeouts = new Map<() => void, NodeJS.Timeout>();

  async processed(event: Partial<T>, options: { timeout: Milliseconds }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.awaiting.push({ partial: event, resolver: resolve });

      const timeoutId = setTimeout(() => {
        this.awaiting = this.awaiting.filter(({ partial, resolver }) => resolver !== resolve);
        this.timeouts.delete(resolve);
        reject(new Error("timeout"));
      }, options.timeout);

      this.timeouts.set(resolve, timeoutId);
    });
  }

  markAsProcessed(event: T) {
    const stillAwaiting: typeof this.awaiting = [];
    for (const entry of this.awaiting) {
      if (isMatch(event, entry.partial)) {
        entry.resolver();
        clearTimeout(this.timeouts.get(entry.resolver));
        this.timeouts.delete(entry.resolver);
      } else {
        stillAwaiting.push(entry);
      }
    }
    this.awaiting = stillAwaiting;
  }
}
