import { Milliseconds } from "../primatives/index.js";
import { CombatantAssociatedData } from "../types.js";
import { ActionResolutionStep, PreUsePositioningActionResolutionStep } from "./action-steps.js";
import { ReplayEventNode } from "./replay-events.js";
import { CombatActionExecutionIntent } from "../combat/combat-actions/combat-action-execution-intent.js";

export class ActionExecutionTracker {
  currentStep: ActionResolutionStep;
  constructor(
    public id: string,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private timeStarted: Milliseconds,
    private combatantContext: CombatantAssociatedData,
    public replayNode: ReplayEventNode
  ) {
    // this.currentStep = action.getFirstResolutionStep();
    this.currentStep = new PreUsePositioningActionResolutionStep(
      this.combatantContext,
      this.actionExecutionIntent
    );
  }
}
