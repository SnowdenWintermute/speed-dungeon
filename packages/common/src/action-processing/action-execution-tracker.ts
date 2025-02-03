import { EntityId, Milliseconds } from "../primatives/index.js";
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
    private previousTrackerInSequenceOption: null | ActionExecutionTracker,
    private timeStarted: Milliseconds,
    combatantContext: CombatantContext,
    public replayNode: ReplayEventNode,
    public sequentialActionManagerId: EntityId
  ) {
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    // in the case of sub-actions, we'll start with spawning the projectiles or vfx
    // otherwise start with the combatant moving
    const firstStepResult = action.getFirstResolutionStep(combatantContext, this);
    if (firstStepResult instanceof Error) throw firstStepResult;
    this.currentStep = firstStepResult;
  }

  setPreviousTrackerInSequence(tracker: ActionExecutionTracker) {
    this.previousTrackerInSequenceOption = tracker;
  }
  getPreviousTrackerInSequenceOption() {
    return this.previousTrackerInSequenceOption;
  }

  storeCompletedStep() {
    this.completedSteps.push(this.currentStep);
  }
  getCompletedSteps() {
    return this.completedSteps;
  }
}
