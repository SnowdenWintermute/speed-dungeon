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

export class PreUsePositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
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
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  setDestination(destination: Vector3) {
    this.destination = destination.clone();
  }

  getTimeToCompletion(): number {
    throw new Error("Method not implemented.");
  }

  isComplete() {
    return this.combatantContext.combatant.combatantProperties.position === this.destination;
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
