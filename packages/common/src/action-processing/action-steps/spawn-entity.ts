import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import cloneDeep from "lodash.clonedeep";

export class SpawnEntityActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    if (!action.getSpawnableEntity) throw new Error("missing expected spawnable entity getter");

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
