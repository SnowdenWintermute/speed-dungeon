import { TransformNode, Vector3 } from "@babylonjs/core";
import {
  ModelMovementTracker,
  ModelMovementType,
  TranslationTracker,
} from "./model-movement-trackers";
import { cloneVector3, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export class ModelMovementManager {
  private activeTrackers: Partial<Record<ModelMovementType, ModelMovementTracker>> = {};
  constructor(public transformNode: TransformNode) {}

  isProcessing() {
    for (const [_, trackerOption] of this.getTrackers()) {
      if (trackerOption) return true;
    }
    return false;
  }

  instantlyMove(newPosition: Vector3) {
    this.transformNode.position.copyFrom(newPosition);
  }

  startTranslating(destination: Vector3, duration: number, onComplete: () => void) {
    const previous = this.transformNode.position.clone();
    const destinationVec3 = cloneVector3(destination);
    // const duration = Vector3.Distance(previous, destination) * COMBATANT_TIME_TO_MOVE_ONE_METER;
    const tracker = new TranslationTracker(
      this.transformNode,
      duration,
      previous,
      destinationVec3,
      onComplete
    );
    this.activeTrackers[ModelMovementType.Translation] = tracker;
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
