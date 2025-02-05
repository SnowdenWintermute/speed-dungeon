import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../combat/index.js";
import { Milliseconds } from "../primatives/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import { ActionResolutionStep } from "./action-steps/index.js";

export class ActionStepTracker {
  currentStep: ActionResolutionStep;
  completedSteps: ActionResolutionStep[] = [];
  constructor(
    public parentActionManager: ActionSequenceManager,
    public id: string,
    public readonly actionExecutionIntent: CombatActionExecutionIntent,
    private previousTrackerInSequenceOption: null | ActionStepTracker,
    private timeStarted: Milliseconds
  ) {
    // in the case of sub-actions, we'll start with spawning the projectiles or vfx
    // otherwise start with the combatant moving
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const firstStepResult = action.getFirstResolutionStep(
      this.parentActionManager.combatantContext,
      this.actionExecutionIntent,
      this.previousTrackerInSequenceOption,
      this.parentActionManager
    );
    if (firstStepResult instanceof Error) throw firstStepResult;

    this.currentStep = firstStepResult;
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
