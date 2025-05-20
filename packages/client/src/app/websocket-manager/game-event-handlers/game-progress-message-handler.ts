import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import {
  COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE,
  CombatLogMessage,
} from "@/app/game/combat-log/combat-log-message";
import { useGameStore } from "@/stores/game-store";
import { ActionCommandType, ERROR_MESSAGES, GameMessage } from "@speed-dungeon/common";

export function gameProgressMessageHandler(message: GameMessage) {
  if (message.showAfterActionQueueResolution) {
    if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
    gameWorld.current.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.ProcessActionCommands,
      actionCommandPayloads: [
        {
          type: ActionCommandType.GameMessages,
          messages: [{ type: message.type, text: message.message }],
        },
      ],
    });
  } else {
    useGameStore.getState().mutateState((state) => {
      const style = COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE[message.type];
      state.combatLogMessages.push(new CombatLogMessage(message.message, style));
    });
  }
}
