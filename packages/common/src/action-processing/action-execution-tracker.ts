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
    public sequentialActionManagerId: EntityId,
    firstStep: ActionResolutionStep
  ) {
    this.currentStep = firstStep;
  }

  setPreviousTrackerInSequence(tracker: ActionExecutionTracker) {
    this.previousTrackerInSequenceOption = tracker;
  }
  getPreviousTrackerInSequenceOption() {
    return this.previousTrackerInSequenceOption;
  }

  storeCompletedStep() {
    if (this.currentStep) this.completedSteps.push(this.currentStep);
  }
  getCompletedSteps() {
    return this.completedSteps;
  }
}
