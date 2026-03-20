import { Quaternion, TransformNode, Vector3 } from "@babylonjs/core";

export enum SceneEntityMovementType {
  Rotation,
  Translation,
}

export abstract class SceneEntityMovementTracker {
  private timeStarted: number = Date.now();
  constructor(
    protected movable: TransformNode,
    protected duration: number
  ) {}

  abstract onComplete: () => void;
  abstract getDestination(): Vector3 | Quaternion;

  percentComplete() {
    const elapsed = Date.now() - this.timeStarted;
    let percent = 1;
    if (this.duration > 0) {
      percent = Math.max(0, Math.min(1, elapsed / this.duration));
    }
    return percent;
  }

  isComplete(): boolean {
    return this.percentComplete() >= 1;
  }

  updateMovable() {
    throw new Error("not implemented");
  }
}
