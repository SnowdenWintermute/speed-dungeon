import { TransformNode } from "@babylonjs/core";
import {
  ModelMovementTracker,
  ModelMovementType,
  RotationTracker,
  TranslationTracker,
} from "./model-movement-trackers";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export class ModelMovementManager {
  private activeTrackers: Partial<Record<ModelMovementType, ModelMovementTracker>> = {};
  constructor(public transformNode: TransformNode) {}

  isProcessing() {
    for (const [_, trackerOption] of this.getTrackers()) {
      if (trackerOption) return true;
    }
    return false;
  }

  startNewMovement(tracker: ModelMovementTracker) {
    tracker.onStart();
    if (tracker instanceof TranslationTracker)
      this.activeTrackers[ModelMovementType.Transaltion] = tracker;
    else if (tracker instanceof RotationTracker)
      this.activeTrackers[ModelMovementType.Rotation] = tracker;
    else return console.error("Invalid tracker");
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
