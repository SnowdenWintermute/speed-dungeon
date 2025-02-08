import { TransformNode } from "@babylonjs/core";
import { ModelMovementTracker, ModelMovementType } from "./model-movement-actions";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export class ModelMovementManager {
  activeTrackers: Partial<Record<ModelMovementType, ModelMovementTracker>> = {};
  constructor(public transformNode: TransformNode) {}

  startNewMovement(tracker: ModelMovementTracker) {
    tracker.onStart();
    this.activeTrackers;
  }

  getTrackers() {
    return iterateNumericEnumKeyedRecord(this.activeTrackers);
  }

  processActiveActions() {
    for (const [movementType, tracker] of this.getTrackers()) {
      tracker.updateMovable();
      if (tracker.isComplete()) {
        tracker.onComplete();
        delete this.activeTrackers[movementType];
      }
    }
  }

  removeActiveModelAction() {}
}
