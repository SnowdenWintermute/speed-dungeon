import { Quaternion, TransformNode } from "@babylonjs/core";
import { ERROR_MESSAGES, Milliseconds } from "@speed-dungeon/common";
import { SceneEntityMovementTracker } from "./movement-tracker";

export class RotationTracker extends SceneEntityMovementTracker {
  constructor(
    movable: TransformNode,
    duration: Milliseconds,
    private previous: Quaternion,
    private destination: Quaternion,
    public onComplete: () => void
  ) {
    super(movable, duration);
  }

  getDestination(): Quaternion {
    return this.destination;
  }

  updateMovable() {
    if (!this.movable.rotationQuaternion) {
      return console.error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    }
    const newPosition = Quaternion.Slerp(this.previous, this.destination, this.percentComplete());
    this.movable.rotationQuaternion.copyFrom(newPosition);
  }
}
