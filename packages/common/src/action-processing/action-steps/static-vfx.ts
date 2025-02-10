import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";

const stepType = ActionResolutionStepType.playStaticVfx;
export class StaticVfxActionResolutionStep extends ActionResolutionStep {
  private vfxPosition: Vector3;
  constructor(
    context: ActionResolutionStepContext,
    private startPosition: Vector3,
    private effectDuration: number,
    private triggerNextStepDuration: number,
    private vfxName: string
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.StaticVfx,
      step: stepType,
      completionOrderId: null,
      vfxName: vfxName,
      position: startPosition,
      effectDuration: effectDuration,
      triggerNextStepDuration: triggerNextStepDuration,
    };

    super(stepType, context, gameUpdateCommand);
    this.vfxPosition = startPosition.clone();
  }

  protected onTick(): void {
    // @TODO -lerp vfx toward destination
  }

  getTimeToCompletion(): number {
    throw new Error("Method not implemented.");
  }

  isComplete(): boolean {
    throw new Error("Method not implemented.");
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new RollIncomingHitOutcomesActionResolutionStep(this.context),
    };
  }
}
