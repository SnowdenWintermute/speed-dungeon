import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
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
