import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { CombatantAssociatedData } from "../../types.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { ActionExecutionTracker } from "../action-execution-tracker.js";

export class DetermineChildActionsActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent,
    tracker: ActionExecutionTracker
    // hits, misses, evades, parries, blocks (used for determining triggers as well as user followthrough animation)
  ) {
    super(ActionResolutionStepType.determineChildActions, null, tracker);
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
