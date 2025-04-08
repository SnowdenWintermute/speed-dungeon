import {
  ActionMotionPhase,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { CombatActionAnimationPhase } from "../../combat/combat-actions/combat-action-animations.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";

export class CombatantMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    step: ActionResolutionStepType,
    actionMotionPhase: ActionMotionPhase,
    animationPhase: CombatActionAnimationPhase
  ) {
    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step,
      completionOrderId: null,
      entityType: SpawnableEntityType.Combatant,
      entityId: context.combatantContext.combatant.entityProperties.id,
      idleOnComplete: animationPhase === CombatActionAnimationPhase.Final,
      instantTransition:
        animationPhase !== CombatActionAnimationPhase.Initial &&
        animationPhase !== CombatActionAnimationPhase.Chambering &&
        animationPhase !== CombatActionAnimationPhase.Final,
    };

    super(
      step,
      context,
      actionMotionPhase,
      animationPhase,
      gameUpdateCommand,
      context.combatantContext.combatant.combatantProperties.position,
      COMBATANT_TIME_TO_MOVE_ONE_METER
    );
  }
}
