import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import {
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
} from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";

const stepType = ActionResolutionStepType.StartConcurrentSubActions;
export class StartConcurrentSubActionsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    super(stepType, context, null);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    const action = COMBAT_ACTIONS[this.context.tracker.actionExecutionIntent.actionName];
    const subActions = action.getConcurrentSubActions(this.context.combatantContext);
    const branchingActions = subActions.map((actionExecutionIntent) => {
      return {
        user: this.context.combatantContext.combatant,
        actionExecutionIntent,
      };
    });
    return branchingActions;
  }
}
