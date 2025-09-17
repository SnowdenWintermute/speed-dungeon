import { ERROR_MESSAGES, EntityMotionUpdate, SpawnableEntityType } from "@speed-dungeon/common";
import { gameWorld, getGameWorld } from "../../../SceneManager";

export function getSceneEntityToUpdate(entityMotionUpdate: EntityMotionUpdate) {
  const { entityId } = entityMotionUpdate;

  console.log(
    "attempting to find entity with id:",
    entityId,
    "entityType",
    entityMotionUpdate.entityType
  );

  console.log(
    "is combatant type: ",
    entityMotionUpdate.entityType === SpawnableEntityType.Combatant
  );

  if (entityMotionUpdate.entityType === SpawnableEntityType.Combatant) {
    const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
    if (!combatantModelOption) {
      console.log(
        "entity type:",
        entityMotionUpdate.entityType,
        "no combatant model of entity id:",
        entityMotionUpdate.entityId
      );
      throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    }
    return combatantModelOption;
  } else {
    console.log("finding action entity");
    return getGameWorld().actionEntityManager.findOne(entityId);
  }
}
