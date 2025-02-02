import { Milliseconds } from "../primatives/index.js";
import { ActionResolutionStep } from "./action-steps/index.js";
import { ReplayEventNode } from "./replay-events.js";
import { CombatActionExecutionIntent } from "../combat/combat-actions/combat-action-execution-intent.js";
import { CombatantContext } from "../combatant-context/index.js";
import { COMBAT_ACTIONS } from "../combat/index.js";

export class ActionExecutionTracker {
  currentStep: ActionResolutionStep;
  completedSteps: ActionResolutionStep[] = [];
  constructor(
    public id: string,
    public readonly actionExecutionIntent: CombatActionExecutionIntent,
    public readonly previousTrackerInSequenceOption: null | ActionExecutionTracker,
    private timeStarted: Milliseconds,
    combatantContext: CombatantContext,
    public replayNode: ReplayEventNode
  ) {
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    // in the case of sub-actions, we'll start with spawning the projectiles or vfx
    // otherwise start with the combatant moving
    // this.currentStep = action.getFirstResolutionStep();
    const firstStepResult = action.getFirstResolutionStep(combatantContext, this);
    if (firstStepResult instanceof Error) throw firstStepResult;
    this.currentStep = firstStepResult;
  }

  storeCompletedStep() {
    this.completedSteps.push(this.currentStep);
  }
  getCompletedSteps() {
    return this.completedSteps;
  }
}
