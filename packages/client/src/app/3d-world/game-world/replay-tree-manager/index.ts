import {
  CombatActionReplayTreePayload,
  InputLock,
  NestedNodeReplayEvent,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { ReplayTreeProcessor } from "./replay-tree-processor";

export class ReplayTreeProcessorManager {
  private queue: { root: NestedNodeReplayEvent; onComplete: () => void }[] = [];
  private current: null | ReplayTreeProcessor = null;
  constructor() {}

  getCurrent() {
    return this.current;
  }

  isEmpty() {
    const hasCurrentActiveTree = this.current && !this.current.isComplete();
    return !hasCurrentActiveTree && this.queue.length === 0;
  }

  clear() {
    this.current = null;
    this.queue = [];
  }

  async enqueueTree(payload: CombatActionReplayTreePayload, onComplete: () => void) {
    this.queue.push({ root: payload.root, onComplete });

    useGameStore.getState().mutateState((state) => {
      const partyOption = getCurrentParty(state, state.username || "");
      if (partyOption && !payload.doNotLockInput) InputLock.lockInput(partyOption.inputLock);
      state.stackedMenuStates = [];
    });
  }

  currentTreeCompleted() {
    return this.current === null || this.current.isComplete();
  }

  startNext() {
    const nextOption = this.queue.shift();
    this.current = nextOption
      ? new ReplayTreeProcessor(nextOption.root, nextOption.onComplete)
      : null;
  }

  process() {
    if (this.current) this.current.processBranches();
    if (this.currentTreeCompleted()) {
      if (this.current !== null) {
        this.current.onComplete();
      }
      this.current = null;
      this.startNext();
    }
  }
}
