import { Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export enum ModelMovementType {
  Rotation,
  Transaltion,
}

export abstract class ModelMovementTracker {
  private timeStarted: number = Date.now();
  constructor(
    protected movable: TransformNode,
    protected duration: number
  ) {}

  abstract isComplete: () => boolean;
  abstract onStart: () => void;
  abstract onComplete: () => void;

  percentComplete() {
    const elapsed = Date.now() - this.timeStarted;
    let percent = 1;
    if (this.duration > 0) percent = Math.max(0, Math.min(1, elapsed / this.duration));
    return percent;
  }

  updateMovable() {
    throw new Error("not implemented");
  }
}

export class TranslationTracker extends ModelMovementTracker {
  constructor(
    movable: TransformNode,
    duration: number,
    private previous: Vector3,
    private destination: Vector3,
    public isComplete: () => boolean,
    public onStart: () => void,
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
    public isComplete: () => boolean,
    public onStart: () => void,
    public onComplete: () => void,
    private previous: Quaternion,
    private destination: Quaternion,
    duration: number
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
