import { GameStateUpdate, Milliseconds } from "@speed-dungeon/common";
import isMatch from "lodash.ismatch";

export class ClientEventsProcessedLog {
  private processed: GameStateUpdate[] = [];
  private awaiting: { partial: Partial<GameStateUpdate>; resolver: () => void }[] = [];
  // Using WeakMap means we don't need to delete the timeout entry once resolver finishes
  private timeouts = new WeakMap<() => void, NodeJS.Timeout>();

  async waitForProcessed(
    gameStateUpdate: Partial<GameStateUpdate>,
    options: { timeout: Milliseconds }
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.awaiting.push({ partial: gameStateUpdate, resolver: resolve });

      const timeoutId = setTimeout(() => {
        this.awaiting = this.awaiting.filter((x) => x.resolver !== resolve);
        this.timeouts.delete(resolve);
        reject(new Error("timeout"));
      }, options.timeout);

      this.timeouts.set(resolve, timeoutId);
    });
  }

  private markAsProcessed(gameStateUpdate: GameStateUpdate) {
    for (const { partial, resolver } of this.awaiting) {
      const matches = isMatch(gameStateUpdate, partial);
      if (matches) {
        resolver();
        this.awaiting = this.awaiting.filter((x) => x.resolver !== resolver);
        const timeoutId = this.timeouts.get(resolver);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }
    this.processed.push(gameStateUpdate);
  }
}
