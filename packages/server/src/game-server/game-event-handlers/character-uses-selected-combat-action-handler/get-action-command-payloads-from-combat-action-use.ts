import { Battle, CombatAction, CombatActionTarget, SpeedDungeonGame } from "@speed-dungeon/common";
import { composeActionCommandPayloadsFromActionResults } from "./compose-action-command-payloads-from-action-results.js";

export function getActionCommandPayloadsFromCombatActionUse(
  game: SpeedDungeonGame,
  actionUserId: string,
  combatAction: CombatAction,
  targets: CombatActionTarget,
  battleOption: null | Battle,
  allyIds: string[]
) {
  const actionResultsResult = SpeedDungeonGame.getActionResults(
    game,
    actionUserId,
    combatAction,
    targets,
    battleOption,
    allyIds
  );
  if (actionResultsResult instanceof Error) return actionResultsResult;
  const actionResults = actionResultsResult;

  return composeActionCommandPayloadsFromActionResults(actionResults);
}
