import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { SceneEntity } from "@/game-world-view/scene-entities";
import { Vector3 } from "@babylonjs/core";
import { SceneEntityChildTransformNodeIdentifierWithDuration } from "@speed-dungeon/common";

export function handleEntityMotionSetNewParentUpdate(
  sceneEntity: SceneEntity,
  identifierWithDuration: null | SceneEntityChildTransformNodeIdentifierWithDuration
) {
  if (identifierWithDuration === null) {
    sceneEntity.rootTransformNode.setParent(null);
    return;
  }

  const { identifier, duration } = identifierWithDuration;

  const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
    identifier,
    getGameWorldView()
  );

  sceneEntity.rootTransformNode.setParent(targetTransformNode);

  sceneEntity.movementManager.startTranslating(Vector3.Zero(), duration, {}, () => {
    // no-op
  });
}
