import { ActionResolutionGameLogMessageUpdateCommand } from "@speed-dungeon/common";
import { GameUpdateTracker } from "./game-update-tracker";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";

export async function postActionResolutionGameLogMessageGameUpdateHandler(
  update: GameUpdateTracker<ActionResolutionGameLogMessageUpdateCommand>
) {
  GameLogMessageService.postActionResolution(update.command);
  update.setAsQueuedToComplete();
}
