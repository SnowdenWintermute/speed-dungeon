import { GameState } from "@/stores/game-store";
import { COMBAT_ACTIONS, ResourcesPaidGameUpdateCommand } from "@speed-dungeon/common";
import { CombatLogMessage, CombatLogMessageStyle } from "./combat-log-message";

export function postActionUseMessageToCombatLog(
  gameState: GameState,
  command: ResourcesPaidGameUpdateCommand
) {
  const { combatantId, actionName, itemsConsumed } = command;

  const action = COMBAT_ACTIONS[actionName];
  if (!action.getOnUseMessage) return;

  const combatantResult = gameState.getCombatant(combatantId);
  if (combatantResult instanceof Error) throw combatantResult;
  const ownedAction = combatantResult.combatantProperties.ownedActions[actionName];
  const actionLevel = !ownedAction ? 0 : ownedAction.level;

  const message = action.getOnUseMessage(combatantResult.entityProperties.name, actionLevel);

  gameState.combatLogMessages.push(new CombatLogMessage(message, CombatLogMessageStyle.Basic));
}
