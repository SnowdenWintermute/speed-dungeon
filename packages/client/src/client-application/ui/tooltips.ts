import { Point } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { ReactNode } from "react";

export class TooltipStore {
  private position: null | Point = null;
  private text: null | ReactNode = null;

  constructor() {
    makeAutoObservable(this);
  }

  get() {
    return { text: this.text, position: this.position };
  }

  set(content: ReactNode, position: Point) {
    this.position = position;
    this.text = content;
  }

  moveTo(position: Point) {
    this.position = position;
  }

  clear() {
    this.position = null;
    this.text = null;
  }
}
