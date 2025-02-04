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

export class PostUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  constructor(
    private context: ActionResolutionStepContext,
    private destinationOption: null | Vector3,
    private animationName: string
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantAnimation,
      completionOrderId: null,
      animationName:
        "Bow shot recovery | Holdable swing recovery | Holdable swing bounced recovery",
      combatantId: context.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
      duration: 1000,
    };

    super(ActionResolutionStepType.postUseAnimation, gameUpdateCommand, context);

    // @TODO -calculate duration based distance to destination dictated by action and target
    this.duration = 1000;
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  getTimeToCompletion(): number {
    // @TODO - determine based on how long we want the animation to take
    // - action type
    // - combatant speed
    return 500;
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  onComplete(): ActionResolutionStepResult {
    // @TODO - check if should run back otherwise return null for the next step
    // need to know the next action in the sequence
    const nextActionOption = this.context.manager.getNextActionInQueue();
    const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
    // action.determineStepAfterPostUseAnimation(nextActionOption)
    return {
      branchingActions: [],
      nextStepOption: new PostUsePositioningActionResolutionStep(this.context, "Run back"),
    };
  }
}
