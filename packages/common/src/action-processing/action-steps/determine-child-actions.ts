import { CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";

export class DetermineChildActionsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    super(ActionResolutionStepType.determineChildActions, context, null);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;
  getBranchingActions(): { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    // this step really does nothing, which allows the step tracker to use that loop to get the action's children
    // as determined by the action in that moment, which is the default behavior of the loop, we just needed
    // a "null step" to do this
    return [];
  }
}
