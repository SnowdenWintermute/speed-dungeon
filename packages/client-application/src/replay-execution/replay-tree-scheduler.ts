import { NestedNodeReplayEvent } from "@speed-dungeon/common";
import { ReplayTreeExecution } from "./tree-execution";
import { ClientApplication } from "..";

export class ReplayTreeScheduler {
  private queue: { root: NestedNodeReplayEvent; onComplete: () => void }[] = [];
  private _current: null | ReplayTreeExecution = null;

  constructor(private clientApplication: ClientApplication) {}

  enqueueTree(root: NestedNodeReplayEvent, doNotLockInput: boolean, onComplete: () => void) {
    this.queue.push({ root, onComplete });

    const { partyOption } = this.clientApplication.gameContext;
    if (partyOption && !doNotLockInput) {
      partyOption.inputLock.lockInput();
    }
  }

  clear() {
    this._current = null;
    this.queue = [];
  }

  tick() {
    if (this.currentTreeCompleted()) {
      if (!this.peekNext()) {
        return;
      } else {
        this.startNext();
      }
    }

    this.process();
  }

  private process() {
    if (this._current) {
      this._current.processBranches();
    }

    if (this.currentTreeCompleted()) {
      if (this._current !== null) {
        this._current.onComplete();
        this._current = null;
      }
      this.startNext();
    }
  }

  get current() {
    return this._current;
  }

  getMinRemainingDuration(): number {
    return this._current?.getMinRemainingDuration() ?? 0;
  }

  private currentTreeCompleted() {
    return this._current === null || this._current.isComplete();
  }

  private startNext() {
    const nextOption = this.queue.shift();
    if (!nextOption) return;
    this._current = new ReplayTreeExecution(
      this.clientApplication,
      nextOption.root,
      nextOption.onComplete
    );
  }

  private peekNext() {
    return this.queue[0];
  }
}
