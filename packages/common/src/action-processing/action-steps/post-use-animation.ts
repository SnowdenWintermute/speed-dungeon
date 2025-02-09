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

const placeholderDuration = 0;

export class PostUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  constructor(
    context: ActionResolutionStepContext,
    private destinationOption: null | Vector3,
    private animationName: AnimationName
  ) {
    const { combatant } = context.combatantContext;
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantAnimation,
      completionOrderId: null,
      animationName,
      combatantId: combatant.entityProperties.id,
      destination: combatant.combatantProperties.position.clone(),
      duration: placeholderDuration,
    };

    super(ActionResolutionStepType.postUseAnimation, context, gameUpdateCommand);

    // @TODO -calculate duration based distance to destination dictated by action and target
    this.duration = gameUpdateCommand.duration = placeholderDuration;
    if (this.destinationOption) gameUpdateCommand.destination = this.destinationOption;
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
    return this.getTimeToCompletion() <= 0;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: null,
    };
  }
}
