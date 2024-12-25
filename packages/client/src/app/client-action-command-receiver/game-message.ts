import { GameMessagesPayload } from "@speed-dungeon/common";
import {
  CombatLogMessage,
  getCombatLogMessageStyleFromGameMessageType,
} from "../game/combat-log/combat-log-message";
import { ClientActionCommandReceiver } from ".";
import { useGameStore } from "@/stores/game-store";

export default async function gameMessageActionCommandHandler(
  this: ClientActionCommandReceiver,
  payload: GameMessagesPayload
) {
  payload.messages.forEach((message) => {
    useGameStore.getState().mutateState((state) => {
      const style = getCombatLogMessageStyleFromGameMessageType(message.type);
      state.combatLogMessages.push(new CombatLogMessage(message.text, style));
    });
  });
}
