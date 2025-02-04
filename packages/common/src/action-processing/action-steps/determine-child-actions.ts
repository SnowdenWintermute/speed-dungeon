import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";

export class DetermineChildActionsActionResolutionStep extends ActionResolutionStep {
  constructor(private context: ActionResolutionStepContext) {
    super(ActionResolutionStepType.determineChildActions, null, context);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: null,
    };
  }
}
