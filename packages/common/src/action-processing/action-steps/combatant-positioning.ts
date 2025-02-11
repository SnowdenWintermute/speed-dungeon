import { Vector3 } from "@babylonjs/core";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { AnimationName, COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { StartUseAnimationActionResolutionStep } from "./start-use-animation.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";

export class CombatantPositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  private timeToTranslate: Milliseconds;
  constructor(
    context: ActionResolutionStepContext,
    public animationName: AnimationName,
    private stepType:
      | ActionResolutionStepType.postUsePositioning
      | ActionResolutionStepType.preUsePositioning,
    endsTurnOnCompletion?: boolean
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantMovement,
      step: stepType,
      completionOrderId: null,
      animationName,
      combatantId: context.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
      duration: 0,
      endsTurnOnCompletion: !!endsTurnOnCompletion,
    };

    super(stepType, context, gameUpdateCommand);

    const { combatantProperties } = this.context.combatantContext.combatant;
    this.originalPosition = combatantProperties.position.clone();

    if (this.stepType === ActionResolutionStepType.postUsePositioning)
      this.destination = gameUpdateCommand.destination = combatantProperties.homeLocation.clone();
    else {
      const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
      const destinationResult = action.getPositionToStartUse(
        context.combatantContext,
        context.actionExecutionIntent
      );
      if (destinationResult instanceof Error) throw destinationResult;
      if (destinationResult === null) throw new Error("Expected destinationResult");
      this.destination = gameUpdateCommand.destination = destinationResult;
    }

    let distance = Vector3.Distance(this.originalPosition, this.destination);
    if (isNaN(distance)) distance = 0;
    const speedMultiplier = 1;
    this.timeToTranslate = gameUpdateCommand.duration =
      COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;

    console.log(ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.stepType].toUpperCase(), this.destination);
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
