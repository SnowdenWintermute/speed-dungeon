import { Matrix, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import {
  CurveType,
  iterateNumericEnumKeyedRecord,
  NormalizedPercentage,
} from "@speed-dungeon/common";
import { SceneEntityMovementTracker, SceneEntityMovementType } from "./movement-tracker";
import { TranslationTracker } from "./translation-tracker";
import { RotationTracker } from "./rotation-tracker";

export class SceneEntityMovementManager {
  public activeTrackers: Partial<Record<SceneEntityMovementType, SceneEntityMovementTracker>> = {};

  static ROTATION_ALIGNMENT_LOCK_THRESHOLD = 0.1;
  public lookingAt: { target: TransformNode; isLocked: boolean; alignmentSpeed: number } | null =
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

  startTranslating(
    destination: Vector3,
    duration: number,
    curves: { pathCurveOption?: CurveType; speedCurveOption?: CurveType },
    onComplete: () => void,
    onUpdate?: (percentComplete: NormalizedPercentage) => void
  ) {
    const previous = this.transformNode.position.clone();
    const tracker = new TranslationTracker(
      this.transformNode,
      duration,
      previous,
      destination,
      curves,
      onComplete,
      onUpdate ||
        (() => {
          // no-op
        })
    );
    const currentTrackerOption = this.activeTrackers[SceneEntityMovementType.Translation];

    if (currentTrackerOption) {
      currentTrackerOption.onComplete();
    }

    this.activeTrackers[SceneEntityMovementType.Translation] = tracker;
  }

  startRotatingTowards(destination: Quaternion, duration: number, onComplete: () => void) {
    console.log("started rotatating toward:", destination, duration);
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

    const currentTrackerOption = this.activeTrackers[SceneEntityMovementType.Rotation];

    if (currentTrackerOption) {
      currentTrackerOption.onComplete();
    }

    this.activeTrackers[SceneEntityMovementType.Rotation] = tracker;
  }

  getTrackers() {
    return iterateNumericEnumKeyedRecord(this.activeTrackers);
  }

  processActiveActions(deltaTime: number) {
    for (const [movementType, tracker] of this.getTrackers()) {
      tracker.updateMovable();

      if (!tracker.isComplete()) continue;

      tracker.onComplete();
      delete this.activeTrackers[movementType];
    }

    if (this.lookingAt) {
      this.smoothLookAtThenLockOn(deltaTime);
    }
  }

  smoothLookAtThenLockOn(deltaTime: number) {
    if (!this.lookingAt) return;
    const lockThreshold = 0.001;
    const { target, isLocked, alignmentSpeed } = this.lookingAt;

    this.transformNode.parent?.computeWorldMatrix(true);
    this.transformNode.computeWorldMatrix(true);
    target.computeWorldMatrix(true);

    const currentQuat = this.transformNode.rotationQuaternion ?? Quaternion.Identity();
    const targetPos = target.getAbsolutePosition();
    const targetQuat = SceneEntityMovementManager.getRotationToPointTowardToward(
      this.transformNode,
      targetPos
    );

    if (isLocked) {
      this.transformNode.rotationQuaternion = targetQuat;
      return;
    }

    const newQuat = Quaternion.Slerp(currentQuat, targetQuat, alignmentSpeed * deltaTime);

    this.transformNode.rotationQuaternion = newQuat;

    // Check if angle between current and target rotation is small enough to lock
    const angle = Quaternion.Dot(newQuat.normalize(), targetQuat.normalize());

    if (1 - angle < lockThreshold) {
      this.transformNode.rotationQuaternion = targetQuat;
      this.lookingAt.isLocked = true;
    }
  }

  static getRotationToPointTowardToward(transformNode: TransformNode, targetPosition: Vector3) {
    const worldPos = transformNode.getAbsolutePosition();
    const lookAtMatrix = Matrix.LookAtLH(worldPos, targetPosition, Vector3.Up());

    // Invert because LookAtLH returns a view matrix
    const worldRotation = Quaternion.FromRotationMatrix(lookAtMatrix).invert();

    if (transformNode.parent) {
      // Convert world rotation to local space
      const parentWorldMatrix = transformNode.parent.getWorldMatrix();
      const parentRotation = Quaternion.FromRotationMatrix(parentWorldMatrix.getRotationMatrix());

      // localRotation = inverse(parent) * worldRotation
      const localRotation = parentRotation.conjugate().multiply(worldRotation);
      return localRotation;
    } else {
      return worldRotation;
    }
  }
}
