import { GameState } from "@/stores/game-store";
import { CombatActionName, EntityId } from "@speed-dungeon/common";

export function synchronizeTargetingIndicators(
  gameState: GameState,
  actionNameOption: CombatActionName | null,
  actionUserId: EntityId,
  targetIds: EntityId[]
) {
  const newIndicators = [];
  for (const indicator of gameState.targetingIndicators) {
    if (actionNameOption === null && indicator.targetedBy === actionUserId) continue;
    if (indicator.targetedBy === actionUserId && indicator.actionName !== actionNameOption)
      continue;
    newIndicators.push(indicator);
  }
  if (actionNameOption === null) return;
  for (const id of targetIds)
    newIndicators.push({ targetedBy: actionUserId, actionName: actionNameOption, targetId: id });

  gameState.targetingIndicators = newIndicators;

  console.log("synchronized indicators", newIndicators);
}
