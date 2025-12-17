import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { EntityMotionUpdate, SpawnableEntityType } from "@speed-dungeon/common";

export function getSceneEntityToUpdate(entityMotionUpdate: EntityMotionUpdate) {
  const { entityId } = entityMotionUpdate;

  if (entityMotionUpdate.entityType === SpawnableEntityType.Combatant) {
    return getGameWorldView().modelManager.findOne(entityId);
  } else {
    return getGameWorldView().actionEntityManager.findOne(entityId, entityMotionUpdate);
  }
}
