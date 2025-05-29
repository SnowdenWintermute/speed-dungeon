import { GameUpdateCommandType } from "@speed-dungeon/common";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes";
import { entityMotionGameUpdateHandler } from "./entity-motion-update-handlers";
import { spawnEntityGameUpdateHandler } from "./spawn-entity-game-update-handler";
import { activatedTriggersGameUpdateHandler } from "./activated-triggers-game-update-handler";
import { resourcesPaidGameUpdateHandler } from "./resources-paid-game-update-handler";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Promise<Error | void>
> = {
  [GameUpdateCommandType.CombatantMotion]: entityMotionGameUpdateHandler,
  [GameUpdateCommandType.ActionEntityMotion]: entityMotionGameUpdateHandler,
  [GameUpdateCommandType.ResourcesPaid]: resourcesPaidGameUpdateHandler,
  [GameUpdateCommandType.ActivatedTriggers]: activatedTriggersGameUpdateHandler,
  [GameUpdateCommandType.HitOutcomes]: hitOutcomesGameUpdateHandler,
  [GameUpdateCommandType.SpawnEntity]: spawnEntityGameUpdateHandler,
};
