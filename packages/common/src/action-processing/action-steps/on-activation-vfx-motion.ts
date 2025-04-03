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
import { COMBAT_ACTIONS, CombatActionAnimationPhase } from "../../combat/index.js";
import { MobileVfxName, Vfx } from "../../vfx/index.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";

const stepType = ActionResolutionStepType.OnActivationVfxMotion;
export class OnActivationVfxMotionActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private animationOption: null | EntityAnimation = null;
  private originalPosition: Vector3;
  constructor(
    context: ActionResolutionStepContext,
    private vfx: Vfx
  ) {
    // @TODO - some should not despawn such as explosion which needs to do a recovery animation
    const despawnOnComplete = vfx.vfxProperties.name === MobileVfxName.Arrow;

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      entityType: SpawnableEntityType.Vfx,
      entityId: vfx.entityProperties.id,
      despawnOnComplete,
    };

    super(stepType, context, gameUpdateCommand);

    const { actionExecutionIntent } = context.tracker;

    this.originalPosition = vfx.vfxProperties.position.clone();

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    // GET ANIMATION
    const animationsOptionResult = action.getActionStepAnimations(this.context);
    if (animationsOptionResult instanceof Error) throw animationsOptionResult;
    if (animationsOptionResult) {
      const animationOption = animationsOptionResult[CombatActionAnimationPhase.Delivery];
      if (animationOption) {
        this.animationOption = animationOption;
      }
    }

    // GET TRANSLATION
    const destinationGetterOption = action.motionPhasePositionGetters[ActionMotionPhase.Delivery];
    let destinationResult = null;
    if (destinationGetterOption) destinationResult = destinationGetterOption(context);
    if (destinationResult instanceof Error) throw destinationResult;
    if (destinationResult?.position) {
      const distance = Vector3.Distance(this.originalPosition, destinationResult.position);
      const timeToTranslate = distance * ARROW_TIME_TO_MOVE_ONE_METER;
      const translation = {
        destination: destinationResult.position.clone(),
        duration: timeToTranslate,
      };
      this.translationOption = translation;
      gameUpdateCommand.translationOption = translation;
    }
  }

  protected onTick(): void {
    if (!this.translationOption) return;

    const normalizedPercentTravelled =
      this.translationOption.duration === 0
        ? 1
        : Math.min(1, this.elapsed / this.translationOption.duration);

    const newPosition = Vector3.Lerp(
      this.originalPosition,
      this.translationOption.destination,
      normalizedPercentTravelled
    );

    this.vfx.vfxProperties.position.copyFrom(newPosition);
  }

  setDestination(destination: Vector3) {}

  getTimeToCompletion(): number {
    let translationTimeRemaining = 0;
    let animationTimeRemaining = 0;
    if (this.translationOption)
      translationTimeRemaining = Math.max(0, this.translationOption.duration - this.elapsed);

    if (this.animationOption && this.animationOption.timing.type === AnimationTimingType.Timed)
      animationTimeRemaining = Math.max(0, this.animationOption.timing.duration - this.elapsed);

    return Math.max(animationTimeRemaining, translationTimeRemaining);
  }

  protected getBranchingActions = () => [];
}
