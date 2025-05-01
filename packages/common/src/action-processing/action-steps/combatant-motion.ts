import { ActionResolutionStepContext, ActionResolutionStepType } from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";

export class CombatantMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step,
      completionOrderId: null,
      entityType: SpawnableEntityType.Combatant,
      entityId: context.combatantContext.combatant.entityProperties.id,
      idleOnComplete: step === ActionResolutionStepType.FinalPositioning,
      instantTransition:
        step !== ActionResolutionStepType.InitialPositioning &&
        step !== ActionResolutionStepType.ChamberingMotion &&
        step !== ActionResolutionStepType.FinalPositioning,
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
