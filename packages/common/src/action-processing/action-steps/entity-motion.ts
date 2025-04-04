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
import { Combatant } from "../../combatants/index.js";

export class EntityMotionActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private animationOption: null | EntityAnimation = null;
  constructor(
    context: ActionResolutionStepContext,
    private stepType: ActionResolutionStepType,
    private actionMotionPhase: ActionMotionPhase,
    private entity: Vfx | Combatant,
    private entityPosition: Vector3,
    private originalPosition: Vector3
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,

      completionOrderId: null,
      entityType: SpawnableEntityType.Combatant,
      entityId: entity.entityProperties.id,
    };

    super(stepType, context, gameUpdateCommand);

    // GET ANIMATION
  }

  protected getAnimation() {
    const { actionExecutionIntent } = this.context.tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const animationsOptionResult = action.getActionStepAnimations(this.context);
    if (animationsOptionResult instanceof Error) throw animationsOptionResult;
    if (animationsOptionResult) {
      const animationOption = animationsOptionResult[this.actionMotionPhase];
      if (animationOption) {
        this.animationOption = animationOption;
      }
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
