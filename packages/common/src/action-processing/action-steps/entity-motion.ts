import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import {
  ActionEntityMotionGameUpdateCommand,
  AnimationTimingType,
  CombatantMotionGameUpdateCommand,
  EntityAnimation,
  EntityTranslation,
} from "../game-update-commands.js";
import { COMBAT_ACTIONS, CombatActionComponent } from "../../combat/index.js";
import { getTranslationTime } from "../../combat/combat-actions/action-implementations/get-translation-time.js";

export class EntityMotionActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private animationOption: null | EntityAnimation = null;
  constructor(
    stepType: ActionResolutionStepType,
    context: ActionResolutionStepContext,
    private gameUpdateCommand:
      | CombatantMotionGameUpdateCommand
      | ActionEntityMotionGameUpdateCommand,
    private entityPosition: Vector3,
    private entitySpeed: number
  ) {
    super(stepType, context, gameUpdateCommand);

    const { actionExecutionIntent } = context.tracker;

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    const animationOption = this.getAnimation();

    if (animationOption) {
      this.animationOption = animationOption;
      this.gameUpdateCommand.mainEntityUpdate.animationOption = animationOption;
    }

    const destinationsOption = this.getDestinations(action);
    if (destinationsOption) {
      const { translationOption, rotationOption } = destinationsOption;
      if (translationOption) {
        this.translationOption = translationOption;
        gameUpdateCommand.mainEntityUpdate.translationOption = translationOption;
      }
      if (rotationOption) gameUpdateCommand.mainEntityUpdate.rotationOption = rotationOption;
    }

    // this is for when we need to tweak positions/parents of projectiles based on steps of
    // their parent action, like pointing an arrow at a target or releasing from the string
    const auxiliaryEntityMotionsGetter =
      action.stepsConfig.steps[this.type]?.getAuxiliaryEntityMotions;
    if (auxiliaryEntityMotionsGetter) {
      const auxiliaryEntityMotions = auxiliaryEntityMotionsGetter(context);
      gameUpdateCommand.auxiliaryUpdates = auxiliaryEntityMotions;
    }
  }

  protected getDestinations(action: CombatActionComponent) {
    const destinationGetterOption = action.stepsConfig.steps[this.type]?.getDestination;
    if (!destinationGetterOption) return null;

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
    const { actionExecutionIntent } = this.context.tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    const animationGetterOption = action.stepsConfig.steps[this.type]?.getAnimation;
    if (!animationGetterOption) return null;

    let animationType;
    animationType = this.context.tracker.meleeAttackAnimationType;
    if (animationType === null) animationType = undefined;

    const animation = animationGetterOption(
      this.context.combatantContext.combatant.combatantProperties,
      this.context.manager.sequentialActionManagerRegistry.animationLengths,
      animationType
    );
    return animation;
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

    return timeToCompletion;
  }

  protected getBranchingActions = () => [];
}
