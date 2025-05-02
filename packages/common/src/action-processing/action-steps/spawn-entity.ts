import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { COMBAT_ACTIONS, COMBAT_ACTION_NAME_STRINGS } from "../../combat/index.js";
import cloneDeep from "lodash.clonedeep";

export class SpawnEntityActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    if (!action.getSpawnableEntity) {
      throw new Error(
        "no spawnable entity for this step" +
          COMBAT_ACTION_NAME_STRINGS[action.name] +
          ACTION_RESOLUTION_STEP_TYPE_STRINGS[step]
      );
    }

    const entity = action.getSpawnableEntity(context);

    context.tracker.spawnedEntityOption = entity;

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.SpawnEntity,
      step,
      completionOrderId: null,
      entity: cloneDeep(entity),
    };

    super(step, context, gameUpdateCommand);
  }

  protected onTick(): void {}

  getTimeToCompletion = () => 0;

  protected getBranchingActions = () => [];
}
