import { Vector3 } from "@babylonjs/core";
import {
  ActionMotionPhase,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import {
  AnimationTimingType,
  EntityAnimation,
  EntityTranslation,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { CombatActionAnimationPhase } from "../../combat/combat-actions/combat-action-animations.js";
import { getTranslationTime } from "../../combat/combat-actions/action-implementations/get-translation-time.js";

export class CombatantMotionActionResolutionStep extends ActionResolutionStep {
  private originalPosition: Vector3;
  private translationOption: null | EntityTranslation = null;
  private animationOption: null | EntityAnimation = null;
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
      entityId: context.combatantContext.combatant.entityProperties.id,
    };

    super(step, context, gameUpdateCommand);
    this.originalPosition = context.combatantContext.combatant.combatantProperties.position.clone();
    const { combatantContext, actionExecutionIntent } = context;

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    const destinationGetterOption = action.motionPhasePositionGetters[actionMotionPhase];
    if (!destinationGetterOption) throw new Error("Expected destination getter was missing");
    const destinationResult = destinationGetterOption(combatantContext, actionExecutionIntent);
    if (destinationResult instanceof Error) throw destinationResult;
    if (destinationResult) {
      const translation = {
        destination: destinationResult,
        duration: getTranslationTime(combatantContext.combatant, destinationResult),
      };
      this.translationOption = translation;
      gameUpdateCommand.translationOption = translation;
    }

    const animationsOption = action.getCombatantUseAnimations(combatantContext);
    if (animationsOption) {
      this.animationOption = animationsOption[animationPhase];
      if (this.animationOption) gameUpdateCommand.animationOption = this.animationOption;
    }
  }

  protected onTick(): void {
    if (!this.translationOption) return;

    const normalizedPercentTravelled =
      this.translationOption.duration === 0 ? 1 : this.elapsed / this.translationOption.duration;

    const newPosition = Vector3.Lerp(
      this.originalPosition,
      this.translationOption.destination,
      normalizedPercentTravelled
    );

    this.context.combatantContext.combatant.combatantProperties.position.copyFrom(newPosition);
  }

  getTimeToCompletion(): number {
    const remainingTimeToTranslate = this.translationOption
      ? Math.max(0, this.translationOption.duration - this.elapsed)
      : 0;

    if (!this.animationOption || this.animationOption?.timing.type === AnimationTimingType.Looping)
      return remainingTimeToTranslate;
    const remainingTimeToAnimate = Math.max(0, this.animationOption.timing.duration - this.elapsed);
    return Math.max(remainingTimeToTranslate, remainingTimeToAnimate);
  }

  protected getBranchingActions = () => [];
}
