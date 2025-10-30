import { makeAutoObservable } from "mobx";
import { runIfInBrowser } from "../utils/index.js";
import { plainToInstance } from "class-transformer";

export class InputLock {
  timeLocked: null | number = null;
  lockDuration: null | number = null;
  constructor() {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  static getDeserialized(plain: InputLock) {
    return plainToInstance(InputLock, plain);
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
