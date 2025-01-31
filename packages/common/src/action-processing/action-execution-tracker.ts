import { Milliseconds } from "../primatives/index.js";
import { CombatantAssociatedData } from "../types.js";
import {
  ActionResolutionStep,
  PreUsePositioningActionResolutionStep,
} from "./action-steps/index.js";
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
    // in the case of sub-actions, we'll start with spawning the projectiles or vfx
    // otherwise start with the combatant moving
    // this.currentStep = action.getFirstResolutionStep();
    this.currentStep = new PreUsePositioningActionResolutionStep(
      this.combatantContext,
      this.actionExecutionIntent
    );
  }
}
