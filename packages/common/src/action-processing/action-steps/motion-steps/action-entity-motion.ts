import { ActionResolutionStepContext, ActionResolutionStepType } from "../index.js";
import {
  ActionEntityMotionGameUpdateCommand,
  ActionEntityMotionUpdate,
  GameUpdateCommandType,
} from "../../game-update-commands.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { ActionEntity } from "../../../action-entities/index.js";
import { COMBAT_ACTIONS } from "../../../combat/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";

export class ActionEntityMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    stepType: ActionResolutionStepType,
    private actionEntity: ActionEntity
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

    if (stepConfig.getEntityToLockOnTo)
      update.lockRotationToFace = stepConfig.getEntityToLockOnTo(context);

    if (stepConfig.getStartPointingToward)
      update.startPointingToward = stepConfig.getStartPointingToward(context);

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

  onComplete() {
    const { context } = this;

    const { actionName } = context.tracker.actionExecutionIntent;
    const action = COMBAT_ACTIONS[actionName];
    const stepConfig = action.stepsConfig.steps[this.type];
    if (!stepConfig) throw new Error("expected step config not found");
    if (!stepConfig.shouldDespawnOnComplete) return [];
    const despawnOnComplete = stepConfig.shouldDespawnOnComplete(context);
    if (!despawnOnComplete) return [];
    const { party } = context.combatantContext;

    AdventuringParty.unregisterActionEntity(party, this.actionEntity.entityProperties.id);

    return [];
  }
}
