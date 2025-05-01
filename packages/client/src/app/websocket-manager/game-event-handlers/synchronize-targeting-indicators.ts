import { GameState } from "@/stores/game-store";
import { CombatActionName, EntityId } from "@speed-dungeon/common";

export function synchronizeTargetingIndicators(
  gameState: GameState,
  actionNameOption: CombatActionName | null,
  actionUserId: EntityId,
  targetIds: EntityId[]
) {
  if (actionNameOption === null) {
    gameState.targetingIndicators = [];
    return [];
  }
  const newIndicators = [];

  // don't remove indicators from other combatants who may also be targeting something
  for (const indicator of gameState.targetingIndicators) {
    if (actionNameOption === null && indicator.targetedBy === actionUserId) continue;
    if (indicator.targetedBy === actionUserId) continue;
    newIndicators.push(indicator);
  }

  for (const id of targetIds)
    newIndicators.push({ targetedBy: actionUserId, actionName: actionNameOption, targetId: id });

  gameState.targetingIndicators = newIndicators;
}
