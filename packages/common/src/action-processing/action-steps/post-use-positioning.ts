import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { CombatantAssociatedData } from "../../types.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";

export class PostUsePositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  constructor(
    private combatantContext: CombatantAssociatedData,
    public animationName: string
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantMovement,
      completionOrderId: null,
      animationName: "Run Forward", // run forward, run backward, run forward injured @TODO -enum
      combatantId: combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
    };

    super(ActionResolutionStepType.postUsePositioning, gameUpdateCommand);

    this.originalPosition = combatantContext.combatant.combatantProperties.position.clone();
    // @TODO - calculate destination based on action
    this.destination = Vector3.Zero();
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
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
      nextStepOption: null,
    };
  }
}
