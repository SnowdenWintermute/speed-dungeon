import { makeAutoObservable } from "mobx";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { instanceToPlain, plainToInstance } from "class-transformer";

export class MaxAndCurrent implements Serializable, ReactiveNode {
  constructor(
    public max: number,
    public current: number
  ) {}

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<MaxAndCurrent>) {
    return plainToInstance(MaxAndCurrent, serialized);
  }

  addValue(value: number) {
    this.current = Math.max(0, Math.min(this.max, this.current + value));
  }

  setCurrent(value: number) {
    this.current = Math.max(0, Math.min(this.max, value));
  }

  isMax() {
    return this.current === this.max;
  }
}
