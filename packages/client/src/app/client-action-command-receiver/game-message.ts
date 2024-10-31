import { ActionCommandManager, GameMessagesPayload } from "@speed-dungeon/common";
import {
  CombatLogMessage,
  getCombatLogMessageStyleFromGameMessageType,
} from "../game/combat-log/combat-log-message";
import { ClientActionCommandReceiver } from ".";

export default function gameMessageActionCommandHandler(
  this: ClientActionCommandReceiver,
  _actionCommandManager: ActionCommandManager,
  payload: GameMessagesPayload
) {
  payload.messages.forEach((message) => {
    this.mutateGameState((state) => {
      const style = getCombatLogMessageStyleFromGameMessageType(message.type);
      state.combatLogMessages.push(new CombatLogMessage(message.text, style));
    });
  });
}
