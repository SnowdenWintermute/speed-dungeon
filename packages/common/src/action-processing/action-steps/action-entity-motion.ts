import { ActionResolutionStepContext, ActionResolutionStepType } from "./index.js";
import {
  ActionEntityMotionGameUpdateCommand,
  ActionEntityMotionUpdate,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { ActionEntity } from "../../action-entities/index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";

export class ActionEntityMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    stepType: ActionResolutionStepType,
    actionEntity: ActionEntity
  ) {
    const update: ActionEntityMotionUpdate = {
      entityType: SpawnableEntityType.ActionEntity,
      entityId: actionEntity.entityProperties.id,
    };

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    const stepConfig = action.stepsConfig.steps[stepType];
    if (!stepConfig) throw new Error("expected step config not found");
    if (stepConfig.shouldDespawnOnComplete)
      update.despawnOnComplete = stepConfig.shouldDespawnOnComplete(context);

    if (stepConfig.getNewParent) update.setParent = stepConfig.getNewParent(context);

    if (stepConfig.getCosmeticDestinationY)
      update.cosmeticDestinationY = stepConfig.getCosmeticDestinationY(context);

    if (stepConfig.getStartPointingTowardEntityOption)
      update.startPointingTowardEntityOption =
        stepConfig.getStartPointingTowardEntityOption(context);

    const { actionName } = context.tracker.actionExecutionIntent;

    const gameUpdateCommand: ActionEntityMotionGameUpdateCommand = {
      type: GameUpdateCommandType.ActionEntityMotion,
      step: stepType,
      actionName,
      completionOrderId: null,
      mainEntityUpdate: update,
    };

    super(
      stepType,
      context,
      gameUpdateCommand,
      actionEntity.actionEntityProperties.position,
      ARROW_TIME_TO_MOVE_ONE_METER
    );
  }
  protected getBranchingActions = () => [];
}
