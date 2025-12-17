import { SceneEntity } from "@/app/3d-world/scene-entities";
import { ModelMovementManager } from "@/app/3d-world/scene-entities/model-movement-manager";
import { Quaternion } from "@babylonjs/core";
import {
  SceneEntityChildTransformNodeIdentifierWithDuration,
  getQuaternionAngleDifference,
} from "@speed-dungeon/common";

export function handleLockRotationToFace(
  sceneEntity: SceneEntity,
  identifierWithDuration: SceneEntityChildTransformNodeIdentifierWithDuration | null
) {
  if (identifierWithDuration === null) {
    sceneEntity.movementManager.lookingAt = null;
    return;
  }

  const { identifier, duration } = identifierWithDuration;

  const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(identifier);

  const targetRotation = ModelMovementManager.getRotationToPointTowardToward(
    sceneEntity.rootTransformNode,
    targetTransformNode.getAbsolutePosition()
  );

  const currentRotation =
    sceneEntity.rootTransformNode.rotationQuaternion ||
    Quaternion.FromEulerAngles(
      sceneEntity.rootTransformNode.rotation.x,
      sceneEntity.rootTransformNode.rotation.y,
      sceneEntity.rootTransformNode.rotation.z
    );

  const angleDifference = getQuaternionAngleDifference(currentRotation, targetRotation);

  const alignmentSpeed = duration ? angleDifference / duration : 0;

  sceneEntity.movementManager.lookingAt = {
    target: targetTransformNode,
    alignmentSpeed,
    isLocked: false,
  };
}
