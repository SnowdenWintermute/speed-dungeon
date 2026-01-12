import { makeAutoObservable } from "mobx";
import { runIfInBrowser } from "../utils/index.js";
import { plainToInstance } from "class-transformer";

export class TimedLock {
  timeLocked: null | number = null;
  lockDuration: null | number = null;
  constructor(options?: { startAsLocked: boolean }) {
    runIfInBrowser(() => makeAutoObservable(this));
    if (options?.startAsLocked) {
      this.lockInput();
    }
  }

  static getDeserialized(plain: TimedLock) {
    const toReturn = plainToInstance(TimedLock, plain);
    return toReturn;
  }

  lockInput() {
    this.timeLocked = Date.now();
    this.lockDuration = null;
  }

  unlockInput() {
    this.timeLocked = null;
    this.lockDuration = null;
  }

  increaseLockoutDuration(ms: number) {
    if (this.lockDuration === null) this.lockDuration = ms;
    else this.lockDuration += ms;
  }

  isLocked() {
    const { timeLocked, lockDuration } = this;
    if (timeLocked === null) return false;
    if (lockDuration === null) return true;
    return Date.now() < timeLocked + lockDuration;
  }
}
