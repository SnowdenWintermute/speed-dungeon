import { Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export enum ModelMovementType {
  Translation,
  Rotation,
}

export abstract class ModelMovementTracker {
  private timeStarted: number = Date.now();
  constructor(
    protected movable: TransformNode,
    protected duration: number
  ) {}

  protected abstract isComplete: () => void;
  protected abstract onStart: () => void;
  protected abstract onComplete: () => void;

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
    protected isComplete: () => boolean,
    protected onStart: () => void,
    protected onComplete: () => void,
    private previous: Vector3,
    private destination: Vector3,
    duration: number
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
    protected isComplete: () => boolean,
    protected onStart: () => void,
    protected onComplete: () => void,
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

export type TranslationModelMovement = {
  type: ModelMovementType.Translation;
  previous: Vector3;
  destination: Vector3;
  duration: number;
  isComplete: () => boolean;
  onStart: () => void;
  onComplete: () => void;
};

export type RotationModelMovement = {
  type: ModelMovementType.Rotation;
  previous: Quaternion;
  destination: Quaternion;
  duration: number;
  isComplete: () => boolean;
  onStart: () => void;
  onComplete: () => void;
};

export type ModelMovementAction = TranslationModelMovement | RotationModelMovement;
