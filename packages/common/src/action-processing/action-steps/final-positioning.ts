import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { AnimationName, COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";

export class FinalPositioningPositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  private timeToTranslate: Milliseconds;
  constructor(
    context: ActionResolutionStepContext,
    public animationName: AnimationName,
    stepType: ActionResolutionStepType.finalPositioning
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      animationOption: { name: AnimationName.MoveForward, shouldRepeat: true },
      entityId: context.combatantContext.combatant.entityProperties.id,
      translationOption: { destination: Vector3.Zero(), duration: 0 },
    };

    super(stepType, context, gameUpdateCommand);

    const { combatantProperties } = this.context.combatantContext.combatant;
    this.originalPosition = combatantProperties.position.clone();

    this.destination = gameUpdateCommand.destination = combatantProperties.homeLocation.clone();

    let distance = Vector3.Distance(this.originalPosition, this.destination);
    if (isNaN(distance)) distance = 0;
    const speedMultiplier = 1;
    this.timeToTranslate = gameUpdateCommand.duration =
      COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;
  }

  protected onTick(): void {
    const normalizedPercentTravelled =
      this.timeToTranslate === 0 ? 1 : this.elapsed / this.timeToTranslate;

    const newPosition = Vector3.Lerp(
      this.originalPosition,
      this.destination,
      normalizedPercentTravelled
    );

    this.context.combatantContext.combatant.combatantProperties.position.copyFrom(newPosition);
  }

  getTimeToCompletion(): number {
    return Math.max(0, this.timeToTranslate - this.elapsed);
  }

  isComplete() {
    const isComplete = this.getTimeToCompletion() <= 0;
    return isComplete;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: null,
    };
  }
}
