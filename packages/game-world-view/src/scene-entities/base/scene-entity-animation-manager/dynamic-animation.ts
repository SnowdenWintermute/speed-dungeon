import { AssetContainer } from "@babylonjs/core";
import { Milliseconds } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";

export abstract class DynamicAnimation {
  protected timeStarted = Date.now();
  public abstract name: string;
  protected abstract duration: number;
  constructor(public despawnOnComplete: boolean) {}

  getLength() {
    return this.duration;
  }

  setDuration(ms: Milliseconds) {
    this.duration = ms;
  }

  clone() {
    return cloneDeep(this);
  }

  start(shouldLoop: boolean, speedModifier?: number) {
    //
  }

  abstract animateScene(scene: AssetContainer): void;
}
