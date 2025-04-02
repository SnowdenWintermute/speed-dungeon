import { Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import {
  ModelMovementTracker,
  ModelMovementType,
  RotationTracker,
  TranslationTracker,
} from "./model-movement-trackers";
import { cloneVector3, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export class ModelMovementManager {
  public activeTrackers: Partial<Record<ModelMovementType, ModelMovementTracker>> = {};
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
    const tracker = new TranslationTracker(
      this.transformNode,
      duration,
      previous,
      destination,
      onComplete
    );
    this.activeTrackers[ModelMovementType.Translation] = tracker;
  }

  startRotatingTowards(target: Vector3, duration: number, onComplete: () => void) {
    const forward = this.transformNode.forward;
    const targetDirection = target.subtract(this.transformNode.position).normalize();
    const destination = Quaternion.FromUnitVectorsToRef(forward, targetDirection, new Quaternion());
    const previous =
      this.transformNode.rotationQuaternion?.clone() ||
      Quaternion.RotationYawPitchRoll(
        this.transformNode.rotation.y,
        this.transformNode.rotation.x,
        this.transformNode.rotation.z
      );
    const tracker = new RotationTracker(
      this.transformNode,
      duration,
      previous,
      destination,
      onComplete
    );
    this.activeTrackers[ModelMovementType.Rotation] = tracker;
  }

  getTrackers() {
    return iterateNumericEnumKeyedRecord(this.activeTrackers);
  }

  processActiveActions() {
    for (const [movementType, tracker] of this.getTrackers()) {
      tracker.updateMovable();

      if (!tracker.isComplete()) continue;

      tracker.onComplete();
      delete this.activeTrackers[movementType];
    }
  }

  removeActiveModelAction() {}
}
