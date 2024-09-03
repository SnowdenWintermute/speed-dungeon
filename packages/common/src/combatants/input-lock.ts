import { immerable } from "immer";

export class InputLock {
  [immerable] = true;
  timeLocked: null | number = null;
  lockDuration: null | number = null;
  constructor() {}
  static lockInput(inputLock: InputLock) {
    inputLock.timeLocked = Date.now();
    inputLock.lockDuration = null;
  }
  static increaseLockoutDuration(inputLock: InputLock, ms: number) {
    if (inputLock.lockDuration === null) inputLock.lockDuration = ms;
    else inputLock.lockDuration += ms;
  }
  static isLocked(inputLock: InputLock) {
    const { timeLocked, lockDuration } = inputLock;
    if (timeLocked !== null && lockDuration === null) return true;
    if (timeLocked !== null && Date.now() < timeLocked + (lockDuration ?? 0)) return true;
    return false;
  }
  static unlockInput(inputLock: InputLock) {
    inputLock.timeLocked = null;
    inputLock.lockDuration = null;
  }
}
