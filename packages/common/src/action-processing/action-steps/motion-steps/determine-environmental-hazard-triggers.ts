import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../../combat/index.js";
import { Combatant } from "../../../combatants/index.js";
import { getFirewallBurnScheduledActions } from "./check-for-combatant-moving-through-firewall.js";

export class TriggerEnvironmentalHazardsActionResolutionStep extends ActionResolutionStep {
  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    return getFirewallBurnScheduledActions(this.context, this);
  }

  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const { actionName } = context.tracker.actionExecutionIntent;
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    const stepConfig = action.stepsConfig.steps[step];
    if (!stepConfig) throw new Error("expected step config not found");

    super(step, context, null);
  }
}
