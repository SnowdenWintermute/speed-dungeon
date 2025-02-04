import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";
import { ActionExecutionTracker } from "../action-execution-tracker.js";

export class MobileVfxActionResolutionStep extends ActionResolutionStep {
  private vfxPosition: Vector3;
  constructor(
    private combatantContext: CombatantContext,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private startPosition: Vector3,
    private destination: Vector3,
    private translationDuration: number,
    vfxName: string,
    tracker: ActionExecutionTracker
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.MobileVfx,
      completionOrderId: null,
      vfxName: vfxName,
      startPosition,
      destination,
      translationDuration,
    };

    super(ActionResolutionStepType.playMobileVfx, gameUpdateCommand, tracker);

    this.vfxPosition = startPosition.clone();
  }

  protected onTick(): void {
    const normalizedPercentTravelled = this.elapsed / this.translationDuration;

    const newPosition = Vector3.Lerp(
      this.startPosition,
      this.destination,
      normalizedPercentTravelled
    );

    this.combatantContext.combatant.combatantProperties.position.copyFrom(newPosition);
  }

  getTimeToCompletion(): number {
    return Math.max(0, this.translationDuration - this.elapsed);
  }

  isComplete() {
    return this.elapsed >= this.translationDuration;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new RollIncomingHitOutcomesActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent,
        this.tracker
      ),
    };
  }
}
