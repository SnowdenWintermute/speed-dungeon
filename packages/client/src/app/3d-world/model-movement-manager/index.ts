import { Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import {
  ModelMovementAction,
  ModelMovementTracker,
  ModelMovementType,
} from "./model-movement-actions";
import { ERROR_MESSAGES, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export class ModelMovementManager {
  activeTrackers: Partial<Record<ModelMovementType, ModelMovementTracker>> = {};
  constructor(public transformNode: TransformNode) {}

  startNewMovement(action: ModelMovementAction, moveable: TransformNode) {
    action.onStart();
    this.activeTrackers[action.type] = new ModelMovementTracker(action, moveable);
  }

  getTrackers() {
    return iterateNumericEnumKeyedRecord(this.activeTrackers);
  }

  processActiveActions() {
    for (const [movementType, tracker] of this.getTrackers())
      MOVEMENT_HANDLERS[movementType](tracker);
  }

  removeActiveModelAction() {}
}

const MOVEMENT_HANDLERS: Record<ModelMovementType, (tracker: ModelMovementTracker) => void> = {
  [ModelMovementType.Translation]: function (tracker: ModelMovementTracker): void {
    const { action, timeStarted } = tracker;
    const { type, previous, destination, duration, isComplete, onComplete } = action;
    if (type !== ModelMovementType.Translation)
      return console.error(new Error(ERROR_MESSAGES.GAME_WORLD.INCORRECT_MODEL_ACTION));
    const moveable = tracker.getMoveable();

    const elapsed = Date.now() - timeStarted;

    let percentTranslated = 1;
    if (duration > 0) percentTranslated = Math.max(0, Math.min(1, elapsed / duration));

    const newPosition = Vector3.Lerp(previous, destination, percentTranslated);
    moveable.position.copyFrom(newPosition);

    if (isComplete()) onComplete();
  },
  [ModelMovementType.Rotation]: function (tracker: ModelMovementTracker): void {
    const { action, timeStarted } = tracker;
    const { type, previous, destination, duration, isComplete, onComplete } = action;
    if (type !== ModelMovementType.Rotation)
      return console.error(new Error(ERROR_MESSAGES.GAME_WORLD.INCORRECT_MODEL_ACTION));
    const moveable = tracker.getMoveable();
    if (!moveable.rotationQuaternion)
      return console.error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);

    const elapsed = Date.now() - timeStarted;
    let percentRotated = 1;
    if (duration > 0) percentRotated = Math.min(1, elapsed / duration);

    const newRotation = Quaternion.Slerp(previous, destination, percentRotated);
    moveable.rotationQuaternion.copyFrom(newRotation);

    if (isComplete()) onComplete();
  },
};
