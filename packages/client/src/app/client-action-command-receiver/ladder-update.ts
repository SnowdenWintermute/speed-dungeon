import { GameMessagesPayload } from "@speed-dungeon/common";
import { CombatLogMessage, CombatLogMessageStyle } from "../game/combat-log/combat-log-message";
import { ClientActionCommandReceiver } from ".";
import { useGameStore } from "@/stores/game-store";

export function gameMessageActionCommandHandler(
  this: ClientActionCommandReceiver,
  payload: GameMessagesPayload
) {
  payload.messages.forEach((message) => {
    useGameStore.getState().mutateState((state) => {
      state.combatLogMessages.push(
        new CombatLogMessage(message.text, CombatLogMessageStyle.LadderProgress)
      );
    });
  });
}
