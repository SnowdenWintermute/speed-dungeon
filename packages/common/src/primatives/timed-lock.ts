import { makeAutoObservable } from "mobx";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";

export class TimedLock implements Serializable, ReactiveNode {
  timeLocked: null | number = null;
  lockDuration: null | number = null;
  constructor(options?: { startAsLocked: boolean }) {
    if (options?.startAsLocked) {
      this.lockInput();
    }
  }

  makeObservable(): void {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<TimedLock>) {
    return plainToInstance(TimedLock, serialized);
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

  get remainingDuration() {
    if (this.lockDuration === null || this.timeLocked === null) return 0;
    return Math.max(0, this.timeLocked + this.lockDuration - Date.now());
  }

  isLocked() {
    const { timeLocked, lockDuration } = this;
    if (timeLocked === null) {
      return false;
    }
    if (lockDuration === null) {
      return true;
    }
    return Date.now() < timeLocked + lockDuration;
  }
}
