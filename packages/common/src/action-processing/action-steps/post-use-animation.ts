import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { PostUsePositioningActionResolutionStep } from "./post-use-positioning.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";

const placeholderDuration = 1000;

export class PostUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  constructor(
    context: ActionResolutionStepContext,
    private destinationOption: null | Vector3,
    private animationName: string
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantAnimation,
      completionOrderId: null,
      animationName: "post use animation",
      combatantId: context.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
      duration: placeholderDuration,
    };

    super(ActionResolutionStepType.postUseAnimation, context, gameUpdateCommand);

    // @TODO -calculate duration based distance to destination dictated by action and target
    this.duration = placeholderDuration;
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  getTimeToCompletion(): number {
    // @TODO - determine based on how long we want the animation to take
    // - action type
    // - combatant speed
    return this.duration - this.elapsed;
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: null,
    };
  }
}
