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

export class StaticVfxActionResolutionStep extends ActionResolutionStep {
  private vfxPosition: Vector3;
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private startPosition: Vector3,
    private effectDuration: number,
    private triggerNextStepDuration: number,
    private vfxName: string
  ) {
    super(ActionResolutionStepType.playMobileVfx);
    this.vfxPosition = startPosition.clone();
  }

  protected initialize(): GameUpdateCommand {
    return {
      type: GameUpdateCommandType.StaticVfx,
      completionOrderId: null,
      vfxName: this.vfxName,
      position: this.startPosition,
      effectDuration: this.effectDuration,
      triggerNextStepDuration: this.triggerNextStepDuration,
    };
  }

  protected onTick(): void {
    // @TODO -lerp vfx toward destination
  }

  getTimeToCompletion(): number {
    throw new Error("Method not implemented.");
  }

  getGameUpdateCommand(): GameUpdateCommand {
    return this.gameUpdateCommand;
  }

  isComplete(): boolean {
    throw new Error("Method not implemented.");
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
