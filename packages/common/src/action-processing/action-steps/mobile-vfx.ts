import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { CombatantAssociatedData } from "../../types.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { EvalOnHitOutcomeTriggersActionResolutionStep } from "./evaluate-hit-outcome-triggers.js";

export class MobileVfxActionResolutionStep extends ActionResolutionStep {
  private vfxPosition: Vector3;
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private startPosition: Vector3,
    private destination: Vector3,
    private translationDuration: number,
    private vfxName: string
  ) {
    super(ActionResolutionStepType.playMobileVfx);
    this.vfxPosition = startPosition.clone();
  }

  protected initialize(): GameUpdateCommand {
    return {
      type: GameUpdateCommandType.MobileVfx,
      completionOrderId: null,
      vfxName: this.vfxName,
      startPosition: this.startPosition,
      destination: this.destination,
      translationDuration: this.translationDuration,
    };
  }

  protected onTick(): void {
    // @TODO -lerp vfx toward destination
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
      nextStepOption: new EvalOnHitOutcomeTriggersActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent
      ),
    };
  }
}
