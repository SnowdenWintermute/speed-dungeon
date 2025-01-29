import { Vector3 } from "@babylonjs/core";
import { CombatActionComponent } from "../combat/index.js";
import { Milliseconds } from "../primatives/index.js";
import { CombatantAssociatedData } from "../types.js";
import { ActionResolutionStep, PreUsePositioningActionResolutionStep } from "./action-steps.js";
import { ReplayEventNode } from "./replay-events.js";

export class ActionExecutionTracker {
  currentStep: ActionResolutionStep;
  constructor(
    public id: string,
    private action: CombatActionComponent,
    private timeStarted: Milliseconds,
    private combatantContext: CombatantAssociatedData,
    public replayNode: ReplayEventNode
  ) {
    // this.currentStep = action.getFirstResolutionStep();
    this.currentStep = new PreUsePositioningActionResolutionStep(
      this.combatantContext,
      Vector3.Zero()
    );
  }
}
