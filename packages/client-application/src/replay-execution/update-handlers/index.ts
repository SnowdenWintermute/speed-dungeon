import {
  ActionResolutionGameLogMessageUpdateCommand,
  ActionUseGameLogMessageUpdateCommand,
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes-update-command-handler";
import { spawnEntitiesGameUpdateHandler } from "./spawn-entities-update-handler";
import { ClientApplication } from "@/client-application";
import { ReplayStepExecution } from "../replay-step-execution";
import { actionCompletionGameUpdateHandler } from "./action-completion-update-handler";
import { resourcesPaidGameUpdateHandler } from "./resources-paid-update-handler";
import { ActionEffectsApplyerCommand } from "./activated-triggers-update-handler";
import { EntityMotionGameUpdateHandlerCommand } from "./entity-motion-update-handler";
import { battleConclusionGameUpdateHandler } from "./battle-conclusion-update-handler";

// @TODO - roll "resources paid", "hit outcomes" and "Activated Triggers"
// into "action effects"

export const GAME_UPDATE_HANDLERS: Record<
  GameUpdateCommandType,
  (clientApplication: ClientApplication, ...args: any[]) => Promise<void>
> = {
  [GameUpdateCommandType.CombatantMotion]: (clientApplication, update) =>
    new EntityMotionGameUpdateHandlerCommand(clientApplication, update).execute(),
  [GameUpdateCommandType.ActionEntityMotion]: (clientApplication, update) =>
    new EntityMotionGameUpdateHandlerCommand(clientApplication, update).execute(),
  [GameUpdateCommandType.ResourcesPaid]: resourcesPaidGameUpdateHandler,
  [GameUpdateCommandType.ActionUseGameLogMessage]: async (
    clientApplication: ClientApplication,
    update: ReplayStepExecution<ActionUseGameLogMessageUpdateCommand>
  ) => {
    clientApplication.eventLogMessageService.postActionUse(update.command);
  },
  [GameUpdateCommandType.ActionResolutionGameLogMessage]: async (
    clientApplication: ClientApplication,
    update: ReplayStepExecution<ActionResolutionGameLogMessageUpdateCommand>
  ) => {
    clientApplication.eventLogMessageService.postActionResolution(update.command);
  },
  [GameUpdateCommandType.ActivatedTriggers]: async (
    clientApplication: ClientApplication,
    update: ReplayStepExecution<ActivatedTriggersGameUpdateCommand>
  ) => {
    new ActionEffectsApplyerCommand(clientApplication, update).execute();
  },
  [GameUpdateCommandType.HitOutcomes]: hitOutcomesGameUpdateHandler,
  [GameUpdateCommandType.SpawnEntities]: spawnEntitiesGameUpdateHandler,
  [GameUpdateCommandType.ActionCompletion]: actionCompletionGameUpdateHandler,
  [GameUpdateCommandType.BattleConclusion]: battleConclusionGameUpdateHandler,
};
