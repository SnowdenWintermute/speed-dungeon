import { SceneEntity } from "@/app/3d-world/scene-entities";
import { ModelMovementManager } from "@/app/3d-world/scene-entities/model-movement-manager";
import { SceneEntityChildTransformNodeIdentifierWithDuration } from "@speed-dungeon/common";

export function handleStartPointingTowardEntity(
  sceneEntity: SceneEntity,
  identifierWithDuration: SceneEntityChildTransformNodeIdentifierWithDuration
) {
  const { identifier, duration } = identifierWithDuration;

  const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(identifier);

  sceneEntity.movementManager.lookingAt = null;

  const newRotation = ModelMovementManager.getRotationToPointTowardToward(
    sceneEntity.rootTransformNode,
    targetTransformNode.getAbsolutePosition()
  );

  sceneEntity.movementManager.startRotatingTowards(newRotation, duration, () => {});
}
