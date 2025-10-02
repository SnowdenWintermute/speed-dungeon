import { ActionResolutionStepContext, ActionResolutionStepType } from "../index.js";
import {
  CombatantMotionGameUpdateCommand,
  CombatantMotionUpdate,
  GameUpdateCommandType,
} from "../../game-update-commands.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { COMBAT_ACTIONS } from "../../../combat/index.js";

export class CombatantMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const { actionName } = context.tracker.actionExecutionIntent;

    const { actionUser } = context.actionUserContext;

    const update: CombatantMotionUpdate = {
      entityType: SpawnableEntityType.Combatant,
      entityId: actionUser.getEntityId(),
      idleOnComplete: step === ActionResolutionStepType.FinalPositioning,
    };

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const stepConfig = action.stepsConfig.getStepConfigOption(step);
    if (!stepConfig) throw new Error("expected step config not found");

    if (stepConfig.shouldIdleOnComplete) update.idleOnComplete = true;

    if (stepConfig.getEquipmentAnimations)
      update.equipmentAnimations = stepConfig.getEquipmentAnimations(
        actionUser,
        context.manager.sequentialActionManagerRegistry.animationLengths
      );

    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
    const gameUpdateCommand: CombatantMotionGameUpdateCommand = {
      type: GameUpdateCommandType.CombatantMotion,
      actionName,
      step,
      completionOrderId: null,
      mainEntityUpdate: update,
    };

    super(step, context, gameUpdateCommand, actionUser);
  }
}
