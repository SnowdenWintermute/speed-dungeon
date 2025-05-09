import { ActionResolutionStepContext, ActionResolutionStepType } from "./index.js";
import {
  ActionEntityMotionGameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { ActionEntity, ActionEntityName } from "../../action-entities/index.js";

export class ActionEntityMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    stepType: ActionResolutionStepType,
    actionEntity: ActionEntity
  ) {
    const despawnOnComplete =
      actionEntity.actionEntityProperties.name === ActionEntityName.Arrow ||
      actionEntity.actionEntityProperties.name === ActionEntityName.IceBolt ||
      stepType === ActionResolutionStepType.RecoveryMotion;

    const { actionName } = context.tracker.actionExecutionIntent;

    const gameUpdateCommand: ActionEntityMotionGameUpdateCommand = {
      type: GameUpdateCommandType.ActionEntityMotion,
      step: stepType,
      actionName,
      completionOrderId: null,
      mainEntityUpdate: {
        entityType: SpawnableEntityType.ActionEntity,
        entityId: actionEntity.entityProperties.id,
        despawnOnComplete,
      },
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
