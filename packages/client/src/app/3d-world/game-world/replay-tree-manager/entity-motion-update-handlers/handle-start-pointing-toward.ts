import { SceneEntity } from "@/app/3d-world/scene-entities";
import { ModelMovementManager } from "@/app/3d-world/scene-entities/model-movement-manager";
import { SceneEntityChildTransformNodeIdentifierWithDuration } from "@speed-dungeon/common";

export function handleStartPointingTowardEntity(
  sceneEntity: SceneEntity,
  identifierWithDuration: SceneEntityChildTransformNodeIdentifierWithDuration | null
) {
  if (identifierWithDuration === null) {
    // @TODO, change how movement managers deal with their trackers so they can only be rotating and translating
    // toward one thing respectively, that way we can cancel it here
    return;
  }
  const { identifier, duration } = identifierWithDuration;

  const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(identifier);
  const targetPosition = targetTransformNode.getAbsolutePosition();

  const newRotation = ModelMovementManager.getRotationToPointTowardToward(
    sceneEntity.rootTransformNode,
    targetPosition
  );

  if (duration === 0) sceneEntity.movementManager.transformNode.rotationQuaternion = newRotation;
  else sceneEntity.movementManager.startRotatingTowards(newRotation, duration, () => {});
}
