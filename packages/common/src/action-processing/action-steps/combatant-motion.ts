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
import { COMBAT_ACTIONS, COMBAT_ACTION_NAME_STRINGS } from "../../combat/index.js";
import {
  ANIMATION_PHASE_NAME_STRINGS,
  CombatActionAnimationPhase,
} from "../../combat/combat-actions/combat-action-animations.js";
import { getTranslationTime } from "../../combat/combat-actions/action-implementations/get-translation-time.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { SKELETAL_ANIMATION_NAME_STRINGS } from "../../app-consts.js";

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
    console.log(
      "entity motion for",
      COMBAT_ACTION_NAME_STRINGS[context.tracker.actionExecutionIntent.actionName],
      context.combatantContext.combatant.entityProperties.name,
      ANIMATION_PHASE_NAME_STRINGS[animationPhase]
    );
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

    super(step, context, gameUpdateCommand);
    this.originalPosition = context.combatantContext.combatant.combatantProperties.position.clone();
    const { combatantContext } = context;
    const { actionExecutionIntent } = context.tracker;

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    const destinationGetterOption = action.motionPhasePositionGetters[actionMotionPhase];
    let destinationResult = null;
    if (destinationGetterOption) destinationResult = destinationGetterOption(context);
    if (destinationResult instanceof Error) throw destinationResult;
    if (destinationResult?.position) {
      const translation = {
        destination: destinationResult.position,
        duration: getTranslationTime(combatantContext.combatant, destinationResult.position),
      };

      this.translationOption = translation;
      gameUpdateCommand.translationOption = translation;
    }

    if (destinationResult?.rotation) {
      console.log("rotation set");
      gameUpdateCommand.rotationOption = {
        rotation: destinationResult.rotation,
        duration: 600,
      };
    }

    const animationsOption = this.context.tracker.actionAnimations;

    if (animationsOption) {
      const animationOption = animationsOption[animationPhase];
      if (animationOption) {
        this.animationOption = animationOption;

        console.log(
          "animation option: ",
          animationOption.name.type,
          SKELETAL_ANIMATION_NAME_STRINGS[animationOption.name.name]
        );
      }
      if (this.animationOption) gameUpdateCommand.animationOption = this.animationOption;
    } else {
      console.log("NO ANIMATION OPTION");
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
