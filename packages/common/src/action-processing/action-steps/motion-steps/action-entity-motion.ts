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

    const update: ActionEntityMotionUpdate = {
      entityType: SpawnableEntityType.ActionEntity,
      entityId: actionEntity.getEntityId(),
    };

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const stepConfig = action.stepsConfig.getStepConfigOption(stepType);
    if (!stepConfig) throw new Error("expected step config not found");

    if (stepConfig.getDespawnOnCompleteCleanupModeOption) {
      const cleanupModeOption = stepConfig.getDespawnOnCompleteCleanupModeOption(context);
      const entityIsStillRegistered = !(
        AdventuringParty.getActionEntity(party, actionUser.getEntityId()) instanceof Error
      );
      if (cleanupModeOption !== null && entityIsStillRegistered) {
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

    const gameUpdateCommand: ActionEntityMotionGameUpdateCommand = {
      type: GameUpdateCommandType.ActionEntityMotion,
      step: stepType,
      actionName,
      completionOrderId: null,
      mainEntityUpdate: update,
    };

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
      console.log("!!!unregisterActionEntity because it was set to despawn");
      const { party } = context.actionUserContext;

      AdventuringParty.unregisterActionEntity(
        party,
        actionUser.entityProperties.id,
        AdventuringParty.getBattleOption(party, context.actionUserContext.game)
      );
    }

    return [];
  }
}
