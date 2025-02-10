import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { StartUseAnimationActionResolutionStep } from "./start-use-animation.js";
import { Milliseconds } from "../../primatives/index.js";
import { AnimationName, COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";

const stepType = ActionResolutionStepType.preUsePositioning;
export class PreUsePositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  private timeToTranslate: Milliseconds;
  constructor(context: ActionResolutionStepContext) {
    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantMovement,
      step: stepType,
      completionOrderId: null,
      animationName: AnimationName.MoveForward,
      combatantId: context.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
      endsTurnOnCompletion: false,
    };

    super(stepType, context, gameUpdateCommand);

    const { combatantProperties } = context.combatantContext.combatant;

    this.originalPosition = combatantProperties.position.clone();
    const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
    const destinationResult = action.getPositionToStartUse(
      context.combatantContext,
      context.actionExecutionIntent
    );
    if (destinationResult instanceof Error) throw destinationResult;
    if (destinationResult === null) throw new Error("Expected destinationResult");
    this.destination = gameUpdateCommand.destination = destinationResult;

    console.log("PRE USE POSITIONING: ", this.destination);

    const distance = Vector3.Distance(this.originalPosition, this.destination);
    const speedMultiplier = 1;
    this.timeToTranslate = COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;
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

  setDestination(destination: Vector3) {
    this.destination = destination.clone();
  }

  getTimeToCompletion(): number {
    return Math.max(0, this.timeToTranslate - this.elapsed);
  }

  isComplete() {
    return this.elapsed >= this.timeToTranslate;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new StartUseAnimationActionResolutionStep(this.context, Vector3.Zero()),
    };
  }
}
