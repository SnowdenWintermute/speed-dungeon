import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";

export class PostUsePositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  private timeToTranslate: Milliseconds;
  constructor(
    private context: ActionResolutionStepContext,
    public animationName: string
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantMovement,
      completionOrderId: null,
      animationName: "Run Back", // run forward, run backward, run forward injured @TODO -enum
      combatantId: context.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
    };

    super(ActionResolutionStepType.postUsePositioning, gameUpdateCommand, context);

    const { combatantProperties } = this.context.combatantContext.combatant;
    this.originalPosition = combatantProperties.position.clone();
    // @TODO - calculate destination based on action
    this.destination = combatantProperties.homeLocation.clone();

    const distance = Vector3.Distance(this.originalPosition, this.destination);
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

  getTimeToCompletion(): number {
    return Math.max(0, this.timeToTranslate - this.elapsed);
  }

  isComplete() {
    return this.elapsed >= this.timeToTranslate;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: null,
    };
  }
}
