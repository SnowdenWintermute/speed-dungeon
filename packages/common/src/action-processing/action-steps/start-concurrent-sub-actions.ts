import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";

const stepType = ActionResolutionStepType.StartConcurrentSubActions;
export class StartConcurrentSubActionsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    super(stepType, context, null);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions() {
    const action = COMBAT_ACTIONS[this.context.tracker.actionExecutionIntent.actionName];

    if (!action.hierarchyProperties.getConcurrentSubActions) return [];

    return action.hierarchyProperties.getConcurrentSubActions(this.context);
  }
}
