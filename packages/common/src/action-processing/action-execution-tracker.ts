import { CombatActionExecutionIntent } from "../combat/index.js";
import { Milliseconds } from "../primatives/index.js";
import { ActionResolutionStep } from "./action-steps/index.js";
import { SequentialActionExecutionManager } from "./sequential-action-execution-manager.js";

export class ActionExecutionTracker {
  currentStep: ActionResolutionStep;
  completedSteps: ActionResolutionStep[] = [];
  constructor(
    public parentActionManager: SequentialActionExecutionManager,
    public id: string,
    public readonly actionExecutionIntent: CombatActionExecutionIntent,
    private previousTrackerInSequenceOption: null | ActionExecutionTracker,
    private timeStarted: Milliseconds,
    firstStep: ActionResolutionStep
  ) {
    this.currentStep = firstStep;
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

  addCurrentStepGameUpdateCommandToReplayNode() {
    const gameUpdateCommandOptionStarted = this.currentStep.getGameUpdateCommandOption();
    if (gameUpdateCommandOptionStarted)
      this.parentActionManager.replayNode.events.push(gameUpdateCommandOptionStarted);
  }
}
