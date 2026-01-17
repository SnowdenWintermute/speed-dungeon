import { makeAutoObservable } from "mobx";
import { runIfInBrowser } from "../utils/index.js";
import { plainToInstance } from "class-transformer";

export class ReferenceCountedLock<T> {
  private references = new Set<T>();
  constructor() {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized<T>(plain: ReferenceCountedLock<T>) {
    const toReturn = plainToInstance(ReferenceCountedLock<T>, plain);
    toReturn.references = new Set(toReturn.references);
    return toReturn;
  }

  add(reference: T) {
    if (this.references.has(reference)) {
      return;
    }

    console.log("added to RC lock:", reference);

    this.references.add(reference);
  }

  remove(reference: T) {
    console.log("removed from RC lock:", reference);
    this.references.delete(reference);
  }

  get isLocked() {
    return this.references.size > 0;
  }
}
