import { Vector3 } from "@babylonjs/core";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionMotionPhase,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import {
  AnimationTimingType,
  EntityAnimation,
  EntityMotionGameUpdateCommand,
  EntityTranslation,
} from "../game-update-commands.js";
import {
  COMBAT_ACTIONS,
  CombatActionAnimationPhase,
  CombatActionComponent,
} from "../../combat/index.js";
import { getTranslationTime } from "../../combat/combat-actions/action-implementations/get-translation-time.js";
import {
  AnimationType,
  DYNAMIC_ANIMATION_NAME_STRINGS,
  SKELETAL_ANIMATION_NAME_STRINGS,
} from "../../app-consts.js";

export class EntityMotionActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private animationOption: null | EntityAnimation = null;
  constructor(
    stepType: ActionResolutionStepType,
    context: ActionResolutionStepContext,
    private actionMotionPhase: ActionMotionPhase,
    private animationPhase: CombatActionAnimationPhase,
    private gameUpdateCommand: EntityMotionGameUpdateCommand,
    private entityPosition: Vector3,
    private entitySpeed: number
  ) {
    super(stepType, context, gameUpdateCommand);

    const { actionExecutionIntent } = context.tracker;

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    const animationOption = this.getAnimation();
    console.log("step:", ACTION_RESOLUTION_STEP_TYPE_STRINGS[stepType], animationOption);
    if (animationOption) {
      switch (animationOption.name.type) {
        case AnimationType.Skeletal:
          console.log(SKELETAL_ANIMATION_NAME_STRINGS[animationOption.name.name]);
          break;
        case AnimationType.Dynamic:
          console.log(DYNAMIC_ANIMATION_NAME_STRINGS[animationOption.name.name]);
          break;
      }
    }
    if (animationOption) {
      this.animationOption = animationOption;
      this.gameUpdateCommand.animationOption = animationOption;
    }

    const { translationOption, rotationOption } = this.getDestinations(action);
    if (translationOption) {
      this.translationOption = translationOption;
      gameUpdateCommand.translationOption = translationOption;
    }
    if (rotationOption) gameUpdateCommand.rotationOption = rotationOption;
  }

  protected getDestinations(action: CombatActionComponent) {
    const destinationGetterOption = action.motionPhasePositionGetters[this.actionMotionPhase];
    let destinationResult = null;
    let translationOption;
    if (destinationGetterOption) destinationResult = destinationGetterOption(this.context);
    if (destinationResult instanceof Error) throw destinationResult;
    if (destinationResult?.position) {
      const translation = {
        destination: destinationResult.position,
        duration: getTranslationTime(
          this.entityPosition,
          destinationResult.position,
          this.entitySpeed
        ),
      };
      translationOption = translation;
    }

    let rotationOption;
    if (destinationResult?.rotation) {
      rotationOption = {
        rotation: destinationResult.rotation,
        duration: 600, // placeholder / general value
      };
    }

    return { translationOption, rotationOption };
  }

  protected getAnimation() {
    if (this.context.tracker.actionAnimations)
      return this.context.tracker.actionAnimations[this.animationPhase];

    const { actionExecutionIntent } = this.context.tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const animationsOptionResult = action.getActionStepAnimations(this.context);
    if (animationsOptionResult instanceof Error) throw animationsOptionResult;
    if (animationsOptionResult) {
      return animationsOptionResult[this.animationPhase];
    }
  }

  protected onTick(): void {
    if (!this.translationOption) return;

    const normalizedPercentTravelled =
      this.translationOption.duration === 0
        ? 1
        : Math.min(1, this.elapsed / this.translationOption.duration);

    const newPosition = Vector3.Lerp(
      this.entityPosition,
      this.translationOption.destination,
      normalizedPercentTravelled
    );

    this.entityPosition.copyFrom(newPosition);
  }

  getTimeToCompletion(): number {
    let translationTimeRemaining = 0;
    let animationTimeRemaining = 0;
    if (this.translationOption)
      translationTimeRemaining = Math.max(0, this.translationOption.duration - this.elapsed);

    if (this.animationOption && this.animationOption.timing.type === AnimationTimingType.Timed)
      animationTimeRemaining = Math.max(0, this.animationOption.timing.duration - this.elapsed);

    const timeToCompletion = Math.max(animationTimeRemaining, translationTimeRemaining);

    console.log("time to completion: ", timeToCompletion);

    return timeToCompletion;
  }

  protected getBranchingActions = () => [];
}
