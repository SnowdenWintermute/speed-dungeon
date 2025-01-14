import { GameMessagesPayload } from "@speed-dungeon/common";
import {
  COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE,
  CombatLogMessage,
} from "../game/combat-log/combat-log-message";
import { ClientActionCommandReceiver } from ".";
import { useGameStore } from "@/stores/game-store";

export default async function gameMessageActionCommandHandler(
  this: ClientActionCommandReceiver,
  payload: GameMessagesPayload
) {
  payload.messages.forEach((message) => {
    useGameStore.getState().mutateState((state) => {
      const style = COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE[message.type];
      state.combatLogMessages.push(new CombatLogMessage(message.text, style));
    });
  });
}
