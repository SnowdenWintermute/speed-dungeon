import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";

export class MobileVfxActionResolutionStep extends ActionResolutionStep {
  private vfxPosition: Vector3;
  constructor(
    context: ActionResolutionStepContext,
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

    super(ActionResolutionStepType.playMobileVfx, context, gameUpdateCommand);

    this.vfxPosition = startPosition.clone();
  }

  protected onTick(): void {
    const normalizedPercentTravelled = this.elapsed / this.translationDuration;

    const newPosition = Vector3.Lerp(
      this.startPosition,
      this.destination,
      normalizedPercentTravelled
    );

    this.context.combatantContext.combatant.combatantProperties.position.copyFrom(newPosition);
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
      nextStepOption: new RollIncomingHitOutcomesActionResolutionStep(this.context),
    };
  }
}
