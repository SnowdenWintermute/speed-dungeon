import { GameMessagesPayload } from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";

export async function gameMessageActionCommandHandler(
  this: ClientActionCommandReceiver,
  payload: GameMessagesPayload
) {
  payload.messages.forEach((message) => {
    GameLogMessageService.postGameMessage(message);
  });
}
