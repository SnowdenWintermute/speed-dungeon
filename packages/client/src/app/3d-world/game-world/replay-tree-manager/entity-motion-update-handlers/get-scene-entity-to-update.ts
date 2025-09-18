import { ERROR_MESSAGES, EntityMotionUpdate, SpawnableEntityType } from "@speed-dungeon/common";
import { gameWorld, getGameWorld } from "../../../SceneManager";

export function getSceneEntityToUpdate(entityMotionUpdate: EntityMotionUpdate) {
  const { entityId } = entityMotionUpdate;

  if (entityMotionUpdate.entityType === SpawnableEntityType.Combatant) {
    const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
    if (!combatantModelOption) {
      throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    }
    return combatantModelOption;
  } else {
    return getGameWorld().actionEntityManager.findOne(entityId, entityMotionUpdate);
  }
}
