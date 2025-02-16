import { Vector3 } from "@babylonjs/core";
import {
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

export class CombatantMotionActionResolutionStep extends ActionResolutionStep {
  private originalPosition: Vector3;
  constructor(
    context: ActionResolutionStepContext,
    step: ActionResolutionStepType,
    private translationOption: null | EntityTranslation = null,
    private animationOption: null | EntityAnimation = null
  ) {
    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step,
      completionOrderId: null,
      entityId: context.combatantContext.combatant.entityProperties.id,
    };
    if (animationOption) gameUpdateCommand.animationOption = animationOption;

    super(step, context, gameUpdateCommand);

    this.originalPosition = context.combatantContext.combatant.combatantProperties.position.clone();

    if (!translationOption) return;
    gameUpdateCommand.translationOption = translationOption;
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

    if (!this.animationOption || this.animationOption?.type === AnimationTimingType.Looping)
      return remainingTimeToTranslate;
    const remainingTimeToAnimate = Math.max(0, this.animationOption.duration - this.elapsed);
    return Math.max(remainingTimeToTranslate, remainingTimeToAnimate);
  }

  protected getBranchingActions = () => [];
}
