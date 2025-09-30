import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import {
  ActionEntityMotionGameUpdateCommand,
  ActionEntityMotionUpdate,
  GameUpdateCommandType,
} from "../../game-update-commands.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { ActionEntity } from "../../../action-entities/index.js";
import { COMBAT_ACTION_NAME_STRINGS, COMBAT_ACTIONS } from "../../../combat/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";

export class ActionEntityMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(context: ActionResolutionStepContext, stepType: ActionResolutionStepType) {
    const { party, actionUser } = context.actionUserContext;

    let actionEntity = actionUser; // try to act on the user first
    if (!(actionUser instanceof ActionEntity))
      // otherwise check if the action has a spawned action entity
      actionEntity = context.tracker.getFirstExpectedSpawnedActionEntity().actionEntity;

    const entityIsStillRegistered = !(
      AdventuringParty.getActionEntity(party, actionUser.getEntityId()) instanceof Error
    );

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
          console.log(
            "set despawn mode for action:",
            COMBAT_ACTION_NAME_STRINGS[action.name],
            cleanupModeOption,
            "in step:",
            ACTION_RESOLUTION_STEP_TYPE_STRINGS[stepType],
            "for entity",
            actionEntity.getEntityId()
          );
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
      console.log("UNREGISTERACTIONENTITY BECAUSE IT WAS SET TO DESPAWN", actionUser.getEntityId());
      const { party } = context.actionUserContext;

      const battleOption = AdventuringParty.getBattleOption(party, context.actionUserContext.game);
      AdventuringParty.unregisterActionEntity(party, actionUser.getEntityId(), battleOption);
    }

    return [];
  }
}
