import { Combatant, Item } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export type DetailableEntity = Combatant | Item;

export class Detailable<T> {
  private hovered: null | T = null;
  private detailed: null | T = null;

  constructor(private onClearDetailed: () => void) {
    makeAutoObservable(this);
  }

  setHovered(toSet: T) {
    this.hovered = toSet;
  }

  setDetailed(toSet: T) {
    this.detailed = toSet;
  }

  get() {
    return { detailed: this.detailed, hovered: this.hovered };
  }

  getIfInstanceOf<K extends new (...args: any[]) => any>(kind: K) {
    const detailed = this.detailed instanceof kind ? this.detailed : null;
    const hovered = this.hovered instanceof kind ? this.hovered : null;
    return { hovered, detailed };
  }

  clearHovered() {
    this.hovered = null;
  }

  clearDetailed() {
    this.detailed = null;
    this.onClearDetailed();
  }

  clear() {
    this.clearHovered();
    this.clearDetailed();
  }
}
