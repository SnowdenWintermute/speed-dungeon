import { makeAutoObservable } from "mobx";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";

export class ReferenceCountedLock<T> implements Serializable, ReactiveNode {
  private references = new Set<T>();

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return { ...instanceToPlain(this), references: [...this.references] };
  }

  static fromSerialized<T>(serialized: SerializedOf<ReferenceCountedLock<T>>) {
    const toReturn = plainToInstance(ReferenceCountedLock<T>, serialized);
    toReturn.references = new Set(toReturn.references);
    return toReturn;
  }

  add(reference: T) {
    if (this.references.has(reference)) {
      return;
    }

    this.references.add(reference);
  }

  remove(reference: T) {
    this.references.delete(reference);
  }

  get isLocked() {
    return this.references.size > 0;
  }
}
