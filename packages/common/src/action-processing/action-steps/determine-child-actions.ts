import { CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";

export class DetermineChildActionsActionResolutionStep extends ActionResolutionStep {
  getNextStepOption(): ActionResolutionStep | null {
    return null;
  }
  getBranchingActions(): { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    return [];
  }
  constructor(context: ActionResolutionStepContext) {
    super(ActionResolutionStepType.determineChildActions, context, null);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: this.getBranchingActions(),
      nextStepOption: this.getNextStepOption(),
    };
  }
}
