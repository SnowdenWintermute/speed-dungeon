import {
  CombatLogMessage,
  getCombatLogMessageStyleFromGameMessageType,
} from "@/app/game/combat-log/combat-log-message";
import { enqueueClientActionCommand } from "@/singletons/action-command-manager";
import { useGameStore } from "@/stores/game-store";
import { ActionCommandType, GameMessage } from "@speed-dungeon/common";

export default function gameProgressMessageHandler(message: GameMessage) {
  if (message.showAfterActionQueueResolution) {
    enqueueClientActionCommand("", [
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
