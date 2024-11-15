import {
  CombatLogMessage,
  getCombatLogMessageStyleFromGameMessageType,
} from "@/app/game/combat-log/combat-log-message";
import { useGameStore } from "@/stores/game-store";
import { ActionCommandType, GameMessage } from "@speed-dungeon/common";
import { enqueueClientActionCommands } from "@/singletons/action-command-manager";

export default function gameProgressMessageHandler(message: GameMessage) {
  if (message.showAfterActionQueueResolution) {
    enqueueClientActionCommands("", [
      {
        type: ActionCommandType.GameMessages,
        messages: [{ text: message.message, type: message.type }],
      },
    ]);
  } else {
    useGameStore.getState().mutateState((state) => {
      const style = getCombatLogMessageStyleFromGameMessageType(message.type);
      state.combatLogMessages.push(new CombatLogMessage(message.message, style));
    });
  }
}
