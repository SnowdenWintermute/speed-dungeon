import { Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES, Milliseconds } from "@speed-dungeon/common";

export enum ModelMovementType {
  Rotation,
  Translation,
}

export abstract class ModelMovementTracker {
  private timeStarted: number = Date.now();
  constructor(
    protected movable: TransformNode,
    protected duration: number
  ) {}

  abstract onComplete: () => void;

  percentComplete() {
    const elapsed = Date.now() - this.timeStarted;
    let percent = 1;
    if (this.duration > 0) percent = Math.max(0, Math.min(1, elapsed / this.duration));
    return percent;
  }

  isComplete(): boolean {
    return this.percentComplete() >= 1;
  }

  updateMovable() {
    throw new Error("not implemented");
  }
}

export class TranslationTracker extends ModelMovementTracker {
  constructor(
    movable: TransformNode,
    duration: Milliseconds,
    private previous: Vector3,
    private destination: Vector3,
    public onComplete: () => void
  ) {
    super(movable, duration);
  }
  updateMovable() {
    const newPosition = Vector3.Lerp(this.previous, this.destination, this.percentComplete());
    this.movable.position.copyFrom(newPosition);
  }
}

export class RotationTracker extends ModelMovementTracker {
  constructor(
    movable: TransformNode,
    duration: Milliseconds,
    public onComplete: () => void,
    private previous: Quaternion,
    private destination: Quaternion
  ) {
    super(movable, duration);
  }

  updateMovable() {
    if (!this.movable.rotationQuaternion)
      return console.error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    const newPosition = Quaternion.Slerp(this.previous, this.destination, this.percentComplete());
    this.movable.rotationQuaternion.copyFrom(newPosition);
  }
}
