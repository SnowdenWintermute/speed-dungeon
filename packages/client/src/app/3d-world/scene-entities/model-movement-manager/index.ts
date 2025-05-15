import { AbstractMesh, Matrix, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import {
  ModelMovementTracker,
  ModelMovementType,
  RotationTracker,
  TranslationTracker,
} from "./model-movement-trackers";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export class ModelMovementManager {
  public activeTrackers: Partial<Record<ModelMovementType, ModelMovementTracker>> = {};

  static ROTATION_ALIGNMENT_LOCK_THRESHOLD = 0.1;
  public lookingAt: { targetMesh: AbstractMesh; isLocked: boolean; alignmentSpeed: number } | null =
    null;
  constructor(public transformNode: TransformNode) {
    transformNode.rotationQuaternion = Quaternion.FromEulerVector(transformNode.rotation);
  }

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

  startRotatingTowards(destination: Quaternion, duration: number, onComplete: () => void) {
    // const forward = this.transformNode.forward;
    // const targetDirection = target.subtract(this.transformNode.position).normalize();
    // const destination = Quaternion.FromUnitVectorsToRef(forward, targetDirection, new Quaternion());
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

    if (this.lookingAt) {
      this.smoothLookAtThenLockOn();
    }
  }

  removeActiveModelAction() {}

  smoothLookAtThenLockOn() {
    if (!this.lookingAt) return;
    const { targetMesh, isLocked, alignmentSpeed } = this.lookingAt;

    const lookAt = Matrix.LookAtLH(
      // Vector3.Zero(),
      this.transformNode.getAbsolutePosition(),
      targetMesh.getAbsolutePosition(),
      Vector3.Up()
    );
    this.transformNode.rotationQuaternion = Quaternion.FromRotationMatrix(lookAt);
    this.transformNode.rotate(Vector3.Left(), Math.PI / 2);

    // // const targetPosition = targetMesh.getAbsolutePosition();
    // const targetPosition = Vector3.Zero();

    // const forward = targetPosition.subtract(this.transformNode.getAbsolutePosition()).normalize();

    // const up = Vector3.Up();
    // // const lookRotation: Quaternion = Quaternion.FromLookDirectionLH(forward, up);
    // // this.transformNode.rotationQuaternion = lookRotation;

    // const worldQuat = Quaternion.FromLookDirectionLH(forward, up);

    // if (this.transformNode.parent) {
    //   const parentMatrix = this.transformNode.parent.getWorldMatrix();
    //   const parentRot = Quaternion.FromRotationMatrix(parentMatrix.getRotationMatrix());
    //   const parentRotInv = parentRot.conjugate();

    //   const localQuat = parentRotInv.multiply(worldQuat);
    //   this.transformNode.rotationQuaternion = localQuat;
    // } else {
    //   this.transformNode.rotationQuaternion = worldQuat;
    // }
  }
}
