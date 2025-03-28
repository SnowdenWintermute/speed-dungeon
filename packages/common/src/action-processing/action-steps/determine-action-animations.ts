import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";

// we want to determine the animations before rolling hit outcomes because
// we want a smooth chain of matching chambering, delivery and recovery animations
// which could otherwise be interrupted by starting with a swing chambering, then breaking the weapon
// causing an unarmed recovery

export class DetermineActionAnimationsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    super(ActionResolutionStepType.DetermineActionAnimations, context, null);

    const { actionExecutionIntent } = context.tracker;

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const animationsOptionResult = action.getActionStepAnimations(context);
    if (animationsOptionResult instanceof Error) throw animationsOptionResult;

    context.tracker.actionAnimations = animationsOptionResult;
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;
  getBranchingActions(): { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    return [];
  }
}
