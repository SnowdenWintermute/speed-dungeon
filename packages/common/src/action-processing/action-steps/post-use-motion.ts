import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { AnimationName } from "../../app-consts.js";
import { COMBAT_ACTION_NAME_STRINGS } from "../../combat/index.js";

const placeholderDuration = 0;

const stepType = ActionResolutionStepType.postUseAnimation;
export class PostUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  constructor(
    context: ActionResolutionStepContext,
    private destinationOption: null | Vector3,
    private animationName: AnimationName
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      entityId: context.combatantContext.combatant.entityProperties.id,
    };

    super(stepType, context, gameUpdateCommand);

    // @TODO -calculate duration based distance to destination dictated by action and target
    this.duration = placeholderDuration;

    console.log(
      "POST USE ANIMATION",
      this.gameUpdateCommandOption,
      COMBAT_ACTION_NAME_STRINGS[this.context.actionExecutionIntent.actionName]
    );
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  getTimeToCompletion(): number {
    // @TODO - determine based on how long we want the animation to take
    // - action type
    // - combatant speed
    return Math.max(0, this.duration - this.elapsed);
  }

  isComplete() {
    return this.getTimeToCompletion() <= 0;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: null,
    };
  }
}
