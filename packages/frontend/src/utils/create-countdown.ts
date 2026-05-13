import { Milliseconds } from "@speed-dungeon/common";

export function createCountdown(endTime: Milliseconds) {
  return {
    getRemainingMs(): Milliseconds {
      return Math.max(0, endTime - Date.now());
    },
    isFinished(): boolean {
      return Date.now() >= endTime;
    },
  };
}
