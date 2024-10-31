import {
  CombatLogMessage,
  getCombatLogMessageStyleFromGameMessageType,
} from "@/app/game/combat-log/combat-log-message";
import { enqueueClientActionCommand } from "@/singletons/action-command-manager";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { ActionCommandType, GameMessage } from "@speed-dungeon/common";

export default function gameProgressMessageHandler(
  mutateGameStore: MutateState<GameState>,
  mutateAlertStore: MutateState<AlertState>,
  message: GameMessage
) {
  mutateGameStore((state) => {
    if (message.showAfterActionQueueResolution) {
      enqueueClientActionCommand(mutateGameStore, mutateAlertStore, "", [
        {
          type: ActionCommandType.GameMessages,
          messages: [{ text: message.message, type: message.type }],
        },
      ]);
    }

    const style = getCombatLogMessageStyleFromGameMessageType(message.type);
    state.combatLogMessages.push(new CombatLogMessage(message.message, style));
  });
}
