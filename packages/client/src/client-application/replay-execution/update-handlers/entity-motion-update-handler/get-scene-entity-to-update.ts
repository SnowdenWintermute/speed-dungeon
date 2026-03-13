import { GameWorldView } from "@/game-world-view";
import { EntityMotionUpdate, SpawnableEntityType } from "@speed-dungeon/common";

export function getSceneEntityToUpdate(
  gameWorldView: GameWorldView,
  entityMotionUpdate: EntityMotionUpdate
) {
  const { entityId } = entityMotionUpdate;

  if (entityMotionUpdate.entityType === SpawnableEntityType.Combatant) {
    return gameWorldView.modelManager.findOne(entityId);
  } else {
    return gameWorldView.actionEntityManager.findOne(entityId, entityMotionUpdate);
  }
}
