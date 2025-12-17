import { ActionUseGameLogMessageUpdateCommand } from "@speed-dungeon/common";
import { GameUpdateTracker } from "./game-update-tracker";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";

export async function postActionUseGameLogMessageGameUpdateHandler(
  update: GameUpdateTracker<ActionUseGameLogMessageUpdateCommand>
) {
  GameLogMessageService.postActionUse(update.command);
  update.setAsQueuedToComplete();
}
