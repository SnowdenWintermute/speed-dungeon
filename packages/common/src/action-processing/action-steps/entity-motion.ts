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
import { COMBAT_ACTIONS, CombatActionComponent } from "../../combat/index.js";
import { Vfx } from "../../vfx/index.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { Combatant } from "../../combatants/index.js";
import { getTranslationTime } from "../../combat/combat-actions/action-implementations/get-translation-time.js";

export class EntityMotionActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private animationOption: null | EntityAnimation = null;
  constructor(
    context: ActionResolutionStepContext,
    stepType: ActionResolutionStepType,
    private actionMotionPhase: ActionMotionPhase,
    entity: Vfx | Combatant,
    private entityPosition: Vector3,
    private entitySpeed: number,
    private originalPosition: Vector3
  ) {
    const entityType =
      entity instanceof Combatant ? SpawnableEntityType.Combatant : SpawnableEntityType.Vfx;

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      entityType,
      entityId: entity.entityProperties.id,
    };

    super(stepType, context, gameUpdateCommand);

    const { actionExecutionIntent } = context.tracker;

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    const animationOption = this.getAnimation();
    if (animationOption) {
      this.animationOption = animationOption;
      gameUpdateCommand.animationOption = animationOption;
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
          this.originalPosition,
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
    const animationsOptionResult = action.getActionStepAnimations(this.context);
    if (animationsOptionResult instanceof Error) throw animationsOptionResult;
    if (animationsOptionResult) {
      return animationsOptionResult[this.actionMotionPhase];
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

    this.entityPosition.copyFrom(newPosition);
  }

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
