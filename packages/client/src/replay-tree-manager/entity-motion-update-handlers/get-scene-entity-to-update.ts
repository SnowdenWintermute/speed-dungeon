import { EntityMotionUpdate, SpawnableEntityType } from "@speed-dungeon/common";
import { getGameWorldView } from "../../../SceneManager";

export function getSceneEntityToUpdate(entityMotionUpdate: EntityMotionUpdate) {
  const { entityId } = entityMotionUpdate;

  if (entityMotionUpdate.entityType === SpawnableEntityType.Combatant) {
    return getGameWorldView().modelManager.findOne(entityId);
  } else {
    return getGameWorldView().actionEntityManager.findOne(entityId, entityMotionUpdate);
  }
}
