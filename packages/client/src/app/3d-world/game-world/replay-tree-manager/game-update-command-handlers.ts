import { GameUpdateCommandType } from "@speed-dungeon/common";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes";
import { entityMotionGameUpdateHandler } from "./entity-motion-update-handlers";
import { activatedTriggersGameUpdateHandler } from "./activated-triggers-game-update-handler";
import { resourcesPaidGameUpdateHandler } from "./resources-paid-game-update-handler";
import { actionCompletionGameUpdateHandler } from "./action-completion-game-update-handler";
import { postActionUseCombatLogMessageGameUpdateHandler } from "./post-action-use-combat-log-message-game-update-handler";
import { spawnEntitiesGameUpdateHandler } from "./spawn-entities-game-update-handler";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Promise<Error | void>
> = {
  [GameUpdateCommandType.CombatantMotion]: entityMotionGameUpdateHandler,
  [GameUpdateCommandType.ActionEntityMotion]: entityMotionGameUpdateHandler,
  [GameUpdateCommandType.ResourcesPaid]: resourcesPaidGameUpdateHandler,
  [GameUpdateCommandType.ActionUseCombatLogMessage]: postActionUseCombatLogMessageGameUpdateHandler,
  [GameUpdateCommandType.ActivatedTriggers]: activatedTriggersGameUpdateHandler,
  [GameUpdateCommandType.HitOutcomes]: hitOutcomesGameUpdateHandler,
  [GameUpdateCommandType.SpawnEntities]: spawnEntitiesGameUpdateHandler,
  [GameUpdateCommandType.ActionCompletion]: actionCompletionGameUpdateHandler,
};
