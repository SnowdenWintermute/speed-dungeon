import {
  ActionResolutionGameLogMessageUpdateCommand,
  ActionUseGameLogMessageUpdateCommand,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes-update-command-handler";
import { entityMotionGameUpdateHandler } from "./entity-motion-update-handlers";
import { activatedTriggersGameUpdateHandler } from "./activated-triggers-game-update-handler";
import { spawnEntitiesGameUpdateHandler } from "./spawn-entities-game-update-handler";
import { ClientApplication } from "@/client-application";
import { ReplayGameUpdateTracker } from "../replay-game-update-completion-tracker";
import { actionCompletionGameUpdateHandler } from "./action-completion-update-handler";
import { resourcesPaidGameUpdateHandler } from "./resources-paid-update-handler";

export const GAME_UPDATE_HANDLERS: Record<
  GameUpdateCommandType,
  (clientApplication: ClientApplication, arg: any) => Promise<void>
> = {
  [GameUpdateCommandType.CombatantMotion]: entityMotionGameUpdateHandler,
  [GameUpdateCommandType.ActionEntityMotion]: entityMotionGameUpdateHandler,
  [GameUpdateCommandType.ResourcesPaid]: resourcesPaidGameUpdateHandler,
  [GameUpdateCommandType.ActionUseGameLogMessage]: async (
    clientApplication: ClientApplication,
    update: ReplayGameUpdateTracker<ActionUseGameLogMessageUpdateCommand>
  ) => {
    clientApplication.eventLogMessageService.postActionUse(update.command);
    update.setAsQueuedToComplete();
  },
  [GameUpdateCommandType.ActionResolutionGameLogMessage]: async (
    clientApplication: ClientApplication,
    update: ReplayGameUpdateTracker<ActionResolutionGameLogMessageUpdateCommand>
  ) => {
    clientApplication.eventLogMessageService.postActionResolution(update.command);
    update.setAsQueuedToComplete();
  },
  [GameUpdateCommandType.ActivatedTriggers]: activatedTriggersGameUpdateHandler,
  [GameUpdateCommandType.HitOutcomes]: hitOutcomesGameUpdateHandler,
  [GameUpdateCommandType.SpawnEntities]: spawnEntitiesGameUpdateHandler,
  [GameUpdateCommandType.ActionCompletion]: actionCompletionGameUpdateHandler,
};
