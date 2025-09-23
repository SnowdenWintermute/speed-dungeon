import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";

export class DetermineChildActionsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    super(ActionResolutionStepType.DetermineChildActions, context, null);

    const currentActionExecutionIntent = context.tracker.actionExecutionIntent;

    const currentAction = COMBAT_ACTIONS[currentActionExecutionIntent.actionName];

    const children = currentAction.hierarchyProperties.getChildren(context, currentAction);

    const childActionIntents = [];
    for (const action of children) {
      const targetsResult = action.targetingProperties.getAutoTarget(
        context.actionUserContext,
        context.tracker
      );
      if (targetsResult instanceof Error) {
        console.error(targetsResult);
        continue;
      }
      if (targetsResult === null) {
        console.error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED);
        continue;
      }

      const actionLevel = currentActionExecutionIntent.rank;

      context.tracker.parentActionManager.sequentialActionManagerRegistry.incrementInputLockReferenceCount();
      childActionIntents.push(
        new CombatActionExecutionIntent(action.name, actionLevel, targetsResult)
      );
    }

    context.tracker.parentActionManager.enqueueActionIntents(childActionIntents.reverse());
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;
  getBranchingActions(): ActionIntentAndUser[] {
    // this step really does nothing, which allows the step tracker to use that loop to get the action's children
    // as determined by the action in that moment, which is the default behavior of the loop, we just needed
    // a "null step" to do this
    return [];
  }
}
