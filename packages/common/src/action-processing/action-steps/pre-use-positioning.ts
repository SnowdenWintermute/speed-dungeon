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
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { CombatActionRequiredRange } from "../../combat/combat-actions/combat-action-range.js";

export class PreUsePositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  private timeToTranslate: Milliseconds;
  constructor(context: ActionResolutionStepContext) {
    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantMovement,
      completionOrderId: null,
      animationName: "Run Forward", // run forward, run backward, run forward injured @TODO -enum
      combatantId: context.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
    };

    super(ActionResolutionStepType.preUsePositioning, context, gameUpdateCommand);
    const { combatantProperties } = context.combatantContext.combatant;

    this.originalPosition = combatantProperties.position.clone();
    // @TODO - calculate destination based on action
    const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
    const actionRange = action.getRequiredRange(combatantProperties);
    switch (actionRange) {
      case CombatActionRequiredRange.Melee:
      case CombatActionRequiredRange.Ranged:
    }
    this.destination = Vector3.Zero();

    const distance = Vector3.Distance(this.originalPosition, this.destination);
    console.log("distance", distance);
    const speedMultiplier = 1;
    this.timeToTranslate = COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;
  }

  protected onTick(): void {
    const normalizedPercentTravelled = this.elapsed / this.timeToTranslate;

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
