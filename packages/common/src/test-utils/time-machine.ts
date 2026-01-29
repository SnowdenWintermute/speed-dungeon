import { vi } from "vitest";

export class TimeMachine {
  private originalDateNow: () => number = Date.now;
  private currentTimeMs = 0;
  private isStarted = false;

  start() {
    if (this.isStarted) {
      throw new Error("Time machine already started");
    }
    vi.useFakeTimers();
    this.isStarted = true;
    this.currentTimeMs = this.originalDateNow();
  }

  advanceTime(milliseconds: number) {
    if (!this.isStarted) {
      throw new Error("Time machine not started");
    }

    vi.advanceTimersByTime(milliseconds);
    this.currentTimeMs = this.currentTimeMs + milliseconds;
    Date.now = () => this.currentTimeMs;
  }

  returnToPresent() {
    Date.now = this.originalDateNow;
    vi.useRealTimers();
    this.currentTimeMs = 0;
    this.isStarted = false;
  }
}
