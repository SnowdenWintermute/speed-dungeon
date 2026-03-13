import {
  ActionResolutionGameLogMessageUpdateCommand,
  ActionUseGameLogMessageUpdateCommand,
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes-update-command-handler";
import { spawnEntitiesGameUpdateHandler } from "./spawn-entities-update-handler";
import { ClientApplication } from "@/client-application";
import { ReplayGameUpdateTracker } from "../replay-game-update-completion-tracker";
import { actionCompletionGameUpdateHandler } from "./action-completion-update-handler";
import { resourcesPaidGameUpdateHandler } from "./resources-paid-update-handler";
import { entityMotionGameUpdateHandler } from "./entity-motion-update-handler";
import { ActionEffectsApplyerCommand } from "./activated-triggers-update-handler";

// @TODO - roll "resources paid", "hit outcomes" and "Activated Triggers"
// into "action effects"

export const GAME_UPDATE_HANDLERS: Record<
  GameUpdateCommandType,
  (clientApplication: ClientApplication, ...args: any[]) => Promise<void>
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
  [GameUpdateCommandType.ActivatedTriggers]: async (
    clientApplication: ClientApplication,
    update: ReplayGameUpdateTracker<ActivatedTriggersGameUpdateCommand>
  ) => {
    new ActionEffectsApplyerCommand(clientApplication, update).execute();
  },
  [GameUpdateCommandType.HitOutcomes]: hitOutcomesGameUpdateHandler,
  [GameUpdateCommandType.SpawnEntities]: spawnEntitiesGameUpdateHandler,
  [GameUpdateCommandType.ActionCompletion]: actionCompletionGameUpdateHandler,
};
