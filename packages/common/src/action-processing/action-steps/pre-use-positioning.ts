import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { StartUseAnimationActionResolutionStep } from "./start-use-animation.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { Milliseconds } from "../../primatives/index.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";

export class PreUsePositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  private timeToTranslate: Milliseconds;
  constructor(
    private combatantContext: CombatantContext,
    private actionExecutionIntent: CombatActionExecutionIntent
  ) {
    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantMovement,
      completionOrderId: null,
      animationName: "Run Forward", // run forward, run backward, run forward injured @TODO -enum
      combatantId: combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
    };

    super(ActionResolutionStepType.preUsePositioning, gameUpdateCommand);

    this.originalPosition = combatantContext.combatant.combatantProperties.position.clone();
    // @TODO - calculate destination based on action
    this.destination = Vector3.Zero();

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
    console.log(
      "new position",
      newPosition,
      "percenttraveled",
      normalizedPercentTravelled,
      "elapsed",
      this.elapsed,
      "time timeToTranslate: ",
      this.timeToTranslate
    );

    this.combatantContext.combatant.combatantProperties.position.copyFrom(newPosition);
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

  getGameUpdateCommand(): GameUpdateCommand {
    return this.gameUpdateCommand;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new StartUseAnimationActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent,
        Vector3.Zero()
      ),
    };
  }
}
