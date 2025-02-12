import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { PayResourceCostsActionResolutionStep } from "./pay-resource-costs.js";
import { CombatActionAnimationCategory } from "../../combat/combat-actions/combat-action-animations.js";

const stepType = ActionResolutionStepType.startUseAnimation;
export class StartUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  originalPosition: Vector3;
  timeToTranslate: Milliseconds;
  constructor(
    context: ActionResolutionStepContext,
    private destinationOption: null | Vector3
  ) {
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
      name: animationsOption[CombatActionAnimationCategory.StartUse],
      durationOption: this.duration,
      shouldRepeat: false,
    };

    const destinationResult = action.getDestinationDuringUse(
      this.context.combatantContext,
      this.context.actionExecutionIntent
    );
    if (destinationResult instanceof Error) throw destinationResult;

    this.originalPosition = context.combatantContext.combatant.combatantProperties.position.clone();
    if (destinationResult) {
      this.destinationOption = destinationResult;
      gameUpdateCommand.translationOption = {
        destination: destinationResult,
        duration: this.duration,
      };
      console.log("START USE ANIMATION", this.destinationOption);
    }

    this.timeToTranslate = this.duration;
  }

  protected onTick(): void {
    if (!this.destinationOption) return;
    if (this.originalPosition.equals(this.destinationOption)) return;

    const normalizedPercentTravelled = Math.min(1, this.elapsed / this.timeToTranslate);

    const newPosition = Vector3.Lerp(
      this.originalPosition,
      this.destinationOption,
      normalizedPercentTravelled
    );

    this.context.combatantContext.combatant.combatantProperties.position.copyFrom(newPosition);
  }

  getTimeToCompletion(): number {
    return this.duration - this.elapsed;
  }

  isComplete() {
    return this.getTimeToCompletion() <= 0;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new PayResourceCostsActionResolutionStep(this.context),
    };
  }
}
