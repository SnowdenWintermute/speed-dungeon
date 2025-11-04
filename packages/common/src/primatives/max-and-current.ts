import { makeAutoObservable } from "mobx";
import { runIfInBrowser } from "../utils/index.js";

export class MaxAndCurrent {
  constructor(
    public max: number,
    public current: number
  ) {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  addValue(value: number) {
    this.current = Math.max(0, Math.min(this.max, this.current + value));
  }
  setCurrent(value: number) {
    this.current = Math.max(0, Math.min(this.max, value));
  }
}
