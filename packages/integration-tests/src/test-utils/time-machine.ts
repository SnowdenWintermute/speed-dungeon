import { vi } from "vitest";

export class TimeMachine {
  private isStarted = false;

  start() {
    if (this.isStarted) {
      throw new Error("Time machine already started");
    }
    // useFakeTimers mocks Date.now as well as setTimeout/setInterval, and
    // advanceTimersByTime advances both. No need to maintain a separate
    // currentTimeMs or override Date.now ourselves — doing so would drift out
    // of sync with vitest's frozen Date and cause ReplayStepExecution.elapsed
    // (which uses Date.now()) to compare against a different time base than
    // what advanceTime advances.
    vi.useFakeTimers();
    this.isStarted = true;
  }

  advanceTime(milliseconds: number, options?: { logMessage: boolean }) {
    if (!this.isStarted) {
      throw new Error("Time machine not started");
    }

    if (options?.logMessage) {
      console.info("advancing time:", milliseconds);
    }

    vi.advanceTimersByTime(milliseconds);
  }

  returnToPresent() {
    vi.useRealTimers();
    this.isStarted = false;
  }
}
