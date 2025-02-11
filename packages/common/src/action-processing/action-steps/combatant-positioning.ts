import { Vector3 } from "@babylonjs/core";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { EntityMotionGameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { AnimationName, COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { StartUseAnimationActionResolutionStep } from "./start-use-animation.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";

export class CombatantPositioningActionResolutionStep extends ActionResolutionStep {
  private originalPosition: Vector3;
  private destination: Vector3;
  private timeToTranslate: Milliseconds;
  constructor(
    context: ActionResolutionStepContext,
    public animationName: AnimationName,
    private stepType:
      | ActionResolutionStepType.postUsePositioning
      | ActionResolutionStepType.preUsePositioning
  ) {
    const gameUpdateCommand: EntityMotionGameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      entityId: context.combatantContext.combatant.entityProperties.id,
    };

    super(stepType, context, gameUpdateCommand);
    this.gameUpdateCommandOption = gameUpdateCommand;

    const { combatantProperties } = this.context.combatantContext.combatant;
    this.originalPosition = combatantProperties.position.clone();

    if (this.stepType === ActionResolutionStepType.postUsePositioning) {
      this.destination = combatantProperties.homeLocation.clone();

      this.gameUpdateCommandOption.animationOption = {
        name: AnimationName.MoveBack,
        shouldRepeat: true,
      };
    } else {
      const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
      const destinationResult = action.getPositionToStartUse(
        context.combatantContext,
        context.actionExecutionIntent
      );
      if (destinationResult instanceof Error) throw destinationResult;
      if (destinationResult === null) throw new Error("Expected destinationResult");
      this.destination = destinationResult;

      this.gameUpdateCommandOption.animationOption = {
        name: AnimationName.MoveForward,
        shouldRepeat: true,
      };
    }

    let distance = Vector3.Distance(this.originalPosition, this.destination);
    if (isNaN(distance)) distance = 0;
    const speedMultiplier = 1;
    this.timeToTranslate = COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;

    this.gameUpdateCommandOption.translationOption = {
      destination: this.destination.clone(),
      duration: this.timeToTranslate,
    };

    console.log(
      ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.stepType].toUpperCase(),
      this.gameUpdateCommandOption.translationOption
    );
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
    let nextStepOption = null;
    if (this.stepType === ActionResolutionStepType.preUsePositioning) {
      nextStepOption = new StartUseAnimationActionResolutionStep(this.context, Vector3.Zero());
    }
    return {
      branchingActions: [],
      nextStepOption,
    };
  }
}
