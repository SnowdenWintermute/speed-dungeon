import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { COMBAT_ACTIONS } from "../../../combat/index.js";
import { getFirewallBurnScheduledActions } from "./check-for-combatant-moving-through-firewall.js";
import { getProjectileMovingThroughFirewallTriggeredActions } from "./get-projectile-moving-through-firewall-triggered-actions.js";

export class TriggerEnvironmentalHazardsActionResolutionStep extends ActionResolutionStep {
  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions() {
    console.log(
      "TRIGGERED PROJEC",
      getProjectileMovingThroughFirewallTriggeredActions(this.context, this)
    );
    return [
      ...getFirewallBurnScheduledActions(this.context, this),
      ...getProjectileMovingThroughFirewallTriggeredActions(this.context, this),
    ];
  }

  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const { actionName } = context.tracker.actionExecutionIntent;
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    let stepConfig;
    if (step === ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers) {
      stepConfig = action.stepsConfig.steps[step];
    } else {
      stepConfig = action.stepsConfig.finalSteps[step];
    }

    if (stepConfig === undefined) throw new Error("expected step config not found");

    super(step, context, null);
  }
}
