import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommandType, SpawnEntityGameUpdateCommand } from "../game-update-commands.js";
import { COMBAT_ACTIONS, COMBAT_ACTION_NAME_STRINGS } from "../../combat/index.js";
import cloneDeep from "lodash.clonedeep";

export class SpawnEntityActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, stepType: ActionResolutionStepType) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    const stepConfig = action.stepsConfig.steps[stepType];
    if (!stepConfig) throw new Error("expected step config not found");
    const { getSpawnableEntity } = stepConfig;
    if (!getSpawnableEntity) {
      throw new Error(
        "no spawnable entity for this step" +
          COMBAT_ACTION_NAME_STRINGS[action.name] +
          ACTION_RESOLUTION_STEP_TYPE_STRINGS[stepType]
      );
    }

    const entity = getSpawnableEntity(context);

    context.tracker.spawnedEntityOption = entity;

    const gameUpdateCommand: SpawnEntityGameUpdateCommand = {
      type: GameUpdateCommandType.SpawnEntity,
      step: stepType,
      actionName: context.tracker.actionExecutionIntent.actionName,
      completionOrderId: null,
      entity: cloneDeep(entity),
    };

    super(stepType, context, gameUpdateCommand);
  }

  protected onTick(): void {}

  getTimeToCompletion = () => 0;

  protected getBranchingActions = () => [];
}
