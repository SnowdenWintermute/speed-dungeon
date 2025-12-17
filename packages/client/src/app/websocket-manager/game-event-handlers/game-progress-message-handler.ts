import { gameWorld } from "@/game-world-view/SceneManager";
import { ModelActionType } from "@/game-world-view/game-world/model-manager/model-actions";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { ActionCommandType, ERROR_MESSAGES, GameMessage } from "@speed-dungeon/common";

export function gameProgressMessageHandler(message: GameMessage) {
  if (message.showAfterActionQueueResolution) {
    if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
    gameWorld.current.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.ProcessActionCommands,
      actionCommandPayloads: [
        {
          type: ActionCommandType.GameMessages,
          messages: [message],
        },
      ],
    });
  } else {
    GameLogMessageService.postGameMessage(message);
  }
}
