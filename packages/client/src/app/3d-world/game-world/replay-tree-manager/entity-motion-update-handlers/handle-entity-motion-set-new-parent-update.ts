import { SceneEntity } from "@/app/3d-world/scene-entities";
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

  const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(identifier);

  sceneEntity.movementManager.lookingAt = null;

  //
  if (motionUpdate.setParentToCombatantHoldable) {
    const { combatantId, holdableId, durationToReachPosition, positionOnTarget } =
      motionUpdate.setParentToCombatantHoldable;
    const combatantModelOption = gameWorld.current?.modelManager.combatantModels[combatantId];
    if (combatantModelOption) {
      const holdableModelOption = combatantModelOption.equipment.holdables[holdableId];
      if (holdableModelOption) {
        const bone = getChildMeshByName(holdableModelOption.rootMesh, "String") as AbstractMesh;

        const intermediaryTransformNode = new TransformNode("");
        intermediaryTransformNode.setParent(bone);
        intermediaryTransformNode.setPositionWithLocalVector(Vector3.Zero());

        actionEntityModelOption.rootTransformNode.setParent(intermediaryTransformNode);
        actionEntityModelOption.movementManager.startTranslating(
          Vector3.Zero(),
          durationToReachPosition,
          () => {}
        );
      }
    }
  }
}
