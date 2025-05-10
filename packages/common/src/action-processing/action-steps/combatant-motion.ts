import { ActionResolutionStepContext, ActionResolutionStepType } from "./index.js";
import {
  CombatantMotionGameUpdateCommand,
  CombatantMotionUpdate,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";

export class CombatantMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const { actionName } = context.tracker.actionExecutionIntent;

    const update: CombatantMotionUpdate = {
      entityType: SpawnableEntityType.Combatant,
      entityId: context.combatantContext.combatant.entityProperties.id,
      idleOnComplete: step === ActionResolutionStepType.FinalPositioning,
      instantTransition:
        step !== ActionResolutionStepType.InitialPositioning &&
        step !== ActionResolutionStepType.ChamberingMotion &&
        step !== ActionResolutionStepType.FinalPositioning,
    };

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    const stepConfig = action.stepsConfig.steps[step];
    if (!stepConfig) throw new Error("expected step config not found");
    if (stepConfig.getEquipmentAnimations)
      update.equipmentAnimations = stepConfig.getEquipmentAnimations(
        context.combatantContext.combatant.combatantProperties,
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

    super(
      step,
      context,
      gameUpdateCommand,
      context.combatantContext.combatant.combatantProperties.position,
      COMBATANT_TIME_TO_MOVE_ONE_METER
    );
  }
}
