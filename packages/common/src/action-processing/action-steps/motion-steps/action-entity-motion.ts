import { ActionResolutionStepContext, ActionResolutionStepType } from "../index.js";
import {
  ActionEntityMotionGameUpdateCommand,
  ActionEntityMotionUpdate,
  GameUpdateCommandType,
} from "../../game-update-commands.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { ActionEntity } from "../../../action-entities/index.js";
import { COMBAT_ACTIONS } from "../../../combat/index.js";

export class ActionEntityMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(context: ActionResolutionStepContext, stepType: ActionResolutionStepType) {
    const { party, actionUser } = context.actionUserContext;

    let actionEntity = actionUser; // try to act on the user first
    if (!(actionUser instanceof ActionEntity))
      // otherwise check if the action has a spawned action entity
      actionEntity = context.tracker.getFirstExpectedSpawnedActionEntity().actionEntity;

    const { actionEntityManager } = party;
    const entityIsStillRegistered =
      actionEntityManager.getActionEntityOption(actionUser.getEntityId()) !== undefined;

    let gameUpdateCommand: null | ActionEntityMotionGameUpdateCommand = null;
    // don't send update if the entity was previously removed
    // which might happen to chaining arrows that despawn before this step
    // if they couldn't find a target
    if (entityIsStillRegistered) {
      const update: ActionEntityMotionUpdate = {
        entityType: SpawnableEntityType.ActionEntity,
        entityId: actionEntity.getEntityId(),
      };

      const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

      const stepConfig = action.stepsConfig.getStepConfigOption(stepType);
      if (!stepConfig) throw new Error("expected step config not found");

      if (stepConfig.getDespawnOnCompleteCleanupModeOption) {
        const cleanupModeOption = stepConfig.getDespawnOnCompleteCleanupModeOption(context);

        if (cleanupModeOption !== null) {
          update.despawnOnCompleteMode = cleanupModeOption;
        }
      }

      if (stepConfig.getNewParent) update.setParent = stepConfig.getNewParent(context);

      if (stepConfig.getCosmeticDestinationY)
        update.cosmeticDestinationY = stepConfig.getCosmeticDestinationY(context);

      if (stepConfig.getEntityToLockOnTo)
        update.lockRotationToFace = stepConfig.getEntityToLockOnTo(context);

      if (stepConfig.getStartPointingToward)
        update.startPointingToward = stepConfig.getStartPointingToward(context);

      const { actionName } = context.tracker.actionExecutionIntent;

      gameUpdateCommand = {
        type: GameUpdateCommandType.ActionEntityMotion,
        step: stepType,
        actionName,
        completionOrderId: null,
        mainEntityUpdate: update,
      };
    }

    super(stepType, context, gameUpdateCommand, actionEntity);
  }
  protected getBranchingActions = () => [];

  onComplete() {
    const { context } = this;
    const { actionUser } = context.actionUserContext;

    if (!(actionUser instanceof ActionEntity))
      throw new Error("expected only actions used action entities to have this step");

    const gameUpdateCommand = context.tracker.currentStep.getGameUpdateCommandOption();

    if (
      gameUpdateCommand &&
      gameUpdateCommand.type === GameUpdateCommandType.ActionEntityMotion &&
      gameUpdateCommand.mainEntityUpdate.despawnOnCompleteMode !== undefined
    ) {
      const { party } = context.actionUserContext;
      const { actionEntityManager } = party;
      actionEntityManager.unregisterActionEntity(actionUser.getEntityId());
    }

    return [];
  }
}
