import { GameState } from "@/stores/game-store";
import { ActionUseCombatLogMessageUpdateCommand, COMBAT_ACTIONS } from "@speed-dungeon/common";
import { CombatLogMessage, CombatLogMessageStyle } from "./combat-log-message";

export function postActionUseMessageToCombatLog(
  gameState: GameState,
  command: ActionUseCombatLogMessageUpdateCommand
) {
  const { actionUseMessageData, actionName } = command;

  const action = COMBAT_ACTIONS[actionName];
  if (!action.getOnUseMessage) return;

  const message = action.getOnUseMessage(actionUseMessageData);

  gameState.combatLogMessages.push(new CombatLogMessage(message, CombatLogMessageStyle.Basic));
}
