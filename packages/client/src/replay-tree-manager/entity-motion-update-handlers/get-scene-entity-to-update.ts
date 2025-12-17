import { EntityMotionUpdate, SpawnableEntityType } from "@speed-dungeon/common";
import { getGameWorld } from "../../../SceneManager";

export function getSceneEntityToUpdate(entityMotionUpdate: EntityMotionUpdate) {
  const { entityId } = entityMotionUpdate;

  if (entityMotionUpdate.entityType === SpawnableEntityType.Combatant) {
    return getGameWorld().modelManager.findOne(entityId);
  } else {
    return getGameWorld().actionEntityManager.findOne(entityId, entityMotionUpdate);
  }
}
