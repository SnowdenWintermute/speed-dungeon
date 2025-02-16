import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import {
  EntityTranslation,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { CombatActionAnimationCategory } from "../../combat/combat-actions/combat-action-animations.js";
import { Milliseconds } from "../../primatives/index.js";

const stepType = ActionResolutionStepType.DeliveryMotion;
export class DeliveryMotionActionResolutionStep extends ActionResolutionStep {
  translationOption: null | EntityTranslation = null;
  duration: Milliseconds;
  originalPosition: Vector3;
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      entityId: context.combatantContext.combatant.entityProperties.id,
    };

    super(stepType, context, gameUpdateCommand);
    const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
    this.duration = action.getExecutionTime();

    const animationsOption = action.getCombatantUseAnimations(this.context.combatantContext);
    gameUpdateCommand.animationOption = {
      name: animationsOption[CombatActionAnimationCategory.Delivery],
      durationOption: this.duration,
      shouldRepeat: false,
    };

    const destinationOptionResult = action.getDestinationDuringDelivery(
      this.context.combatantContext,
      this.context.actionExecutionIntent
    );
    if (destinationOptionResult instanceof Error) throw destinationOptionResult;

    this.originalPosition = context.combatantContext.combatant.combatantProperties.position.clone();
    if (destinationOptionResult) {
      gameUpdateCommand.translationOption = {
        destination: destinationOptionResult,
        duration: this.duration,
      };
    }
  }

  protected onTick(): void {
    // @TODO - translate using some shared translate function
  }

  getTimeToCompletion(): number {
    return this.duration - this.elapsed;
  }

  protected getBranchingActions = () => [];
}
