import { Point } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class TooltipStore {
  private position: null | Point = null;
  private text: null | string = null;

  constructor() {
    makeAutoObservable(this);
  }

  get() {
    return { text: this.text, position: this.position };
  }

  set(text: string, position: Point) {
    this.position = position;
    this.text = text;
  }

  moveTo(position: Point) {
    this.position = position;
  }

  clear() {
    this.position = null;
    this.text = null;
  }
}
