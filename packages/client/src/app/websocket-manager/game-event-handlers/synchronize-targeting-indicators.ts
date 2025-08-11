import { getGameWorld } from "@/app/3d-world/SceneManager";
import { TargetIndicator } from "@/app/3d-world/scene-entities/character-models/target-indicator-manager";
import { GameState } from "@/stores/game-store";
import { CombatActionName, EntityId } from "@speed-dungeon/common";

export function synchronizeTargetingIndicators(
  gameState: GameState,
  actionNameOption: CombatActionName | null,
  actionUserId: EntityId,
  targetIds: EntityId[]
) {
  const newIndicators = [];

  if (actionNameOption === null) {
    const newIndicators = gameState.targetingIndicators.filter(
      (item) => item.targetedBy !== actionUserId
    );

    gameState.targetingIndicators = newIndicators;
  } else {
    // don't remove indicators from other combatants who may also be targeting something
    for (const indicator of gameState.targetingIndicators) {
      if (actionNameOption === null && indicator.targetedBy === actionUserId) continue;
      if (indicator.targetedBy === actionUserId) continue;
      newIndicators.push(indicator);
    }

    for (const id of targetIds)
      newIndicators.push(new TargetIndicator(actionUserId, id, actionNameOption));

    gameState.targetingIndicators = newIndicators;
  }

  const gameWorld = getGameWorld();

  for (const combatantModel of Object.values(gameWorld.modelManager.combatantModels)) {
    const targetingThisModel = newIndicators.filter(
      (item) => item.targetId === combatantModel.entityId
    );
    combatantModel.targetingIndicatorBillboardManager.synchronizeIndicators(targetingThisModel);
  }
}
