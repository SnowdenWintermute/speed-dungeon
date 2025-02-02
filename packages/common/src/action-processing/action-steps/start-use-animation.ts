import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { CombatantAssociatedData } from "../../types.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Milliseconds } from "../../primatives/index.js";
import { PayResourceCostsActionResolutionStep } from "./pay-resource-costs.js";

export class StartUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private destinationOption: null | Vector3
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.CombatantAnimation,
      completionOrderId: null,
      animationName: "Raise and Draw Bow",
      combatantId: combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
      duration: 1000,
    };

    super(ActionResolutionStepType.startUseAnimation, gameUpdateCommand);

    // @TODO -calculate duration based distance to destination dictated by action and target
    this.duration = 1000;
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination if there is one, such as for attack on approach
  }

  getTimeToCompletion(): number {
    return COMBAT_ACTIONS[this.actionExecutionIntent.actionName].getExecutionTime();
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new PayResourceCostsActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent
      ),
    };
  }
}
