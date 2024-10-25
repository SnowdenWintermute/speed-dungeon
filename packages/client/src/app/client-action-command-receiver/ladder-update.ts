import { ActionCommandManager, LadderUpdatePayload } from "@speed-dungeon/common";
import { CombatLogMessage, CombatLogMessageStyle } from "../game/combat-log/combat-log-message";
import { ClientActionCommandReceiver } from ".";

export default function ladderUpdateActionCommandHandler(
  this: ClientActionCommandReceiver,
  _actionCommandManager: ActionCommandManager,
  payload: LadderUpdatePayload
) {
  payload.messages.forEach((message) => {
    this.mutateGameState((state) => {
      state.combatLogMessages.push(
        new CombatLogMessage(message, CombatLogMessageStyle.LadderProgress)
      );
    });
  });
}
