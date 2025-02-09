import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { PayResourceCostsActionResolutionStep } from "./pay-resource-costs.js";
import { AnimationName, COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { CombatActionAnimationCategory } from "../../combat/combat-actions/combat-action-animations.js";

export class StartUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  originalPosition: Vector3;
  destination: Vector3;
  timeToTranslate: Milliseconds;
  constructor(
    context: ActionResolutionStepContext,
    private destinationOption: null | Vector3
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantAnimation,
      completionOrderId: null,
      animationName: AnimationName.Idle,
      combatantId: context.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
      duration: 1000,
    };

    super(ActionResolutionStepType.startUseAnimation, context, gameUpdateCommand);
    const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
    const animationsOption = action.getCombatantUseAnimations(this.context.combatantContext);
    if (animationsOption)
      gameUpdateCommand.animationName = animationsOption[CombatActionAnimationCategory.StartUse];
    const destinationResult = action.getDestinationDuringUse(
      this.context.combatantContext,
      this.context.actionExecutionIntent
    );
    if (destinationResult instanceof Error) throw destinationResult;
    this.originalPosition = context.combatantContext.combatant.combatantProperties.position.clone();

    gameUpdateCommand.duration = this.duration = action.getExecutionTime();
    gameUpdateCommand.destination = this.destination = destinationResult;
    let distance = Vector3.Distance(this.originalPosition, this.destination);
    if (isNaN(distance)) distance = 0;

    console.log("distance: ", distance);

    const speedMultiplier = 1;
    this.timeToTranslate = COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;
    console.log("time to translate: ", this.timeToTranslate);
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

  getTimeToCompletion(): number {
    return (
      COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName].getExecutionTime() -
      this.elapsed
    );
  }

  isComplete() {
    return this.getTimeToCompletion() <= 0;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new PayResourceCostsActionResolutionStep(this.context),
    };
  }
}
