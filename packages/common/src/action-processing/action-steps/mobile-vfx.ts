import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { EvalOnHitOutcomeTriggersActionResolutionStep } from "./evaluate-hit-outcome-triggers.js";
import { CombatantContext } from "../../combatant-context/index.js";

export class MobileVfxActionResolutionStep extends ActionResolutionStep {
  private vfxPosition: Vector3;
  constructor(
    private combatantContext: CombatantContext,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private startPosition: Vector3,
    private destination: Vector3,
    private translationDuration: number,
    vfxName: string
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.MobileVfx,
      completionOrderId: null,
      vfxName: vfxName,
      startPosition,
      destination,
      translationDuration,
    };

    super(ActionResolutionStepType.playMobileVfx, gameUpdateCommand);
    this.vfxPosition = startPosition.clone();
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
