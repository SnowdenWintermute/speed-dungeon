import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { COMBAT_ACTIONS } from "../../../combat/index.js";
import { getFirewallBurnScheduledActions } from "./check-for-combatant-moving-through-firewall.js";
import { getProjectileMovingThroughFirewallTriggeredActions } from "./get-projectile-moving-through-firewall-triggered-actions.js";
import { ActionEntity } from "../../../action-entities/index.js";
import { Combatant } from "../../../combatants/index.js";

export class TriggerEnvironmentalHazardsActionResolutionStep extends ActionResolutionStep {
  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions(): ActionIntentAndUser[] {
    const { actionUser } = this.context.actionUserContext;

    const toReturn: ActionIntentAndUser[] = [];

    if (actionUser instanceof ActionEntity) {
      toReturn.push(
        ...getProjectileMovingThroughFirewallTriggeredActions(this.context, this, actionUser)
      );
    } else if (actionUser instanceof Combatant) {
      toReturn.push(...getFirewallBurnScheduledActions(this.context, this));
    }

    return toReturn;
  }

  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const { actionName } = context.tracker.actionExecutionIntent;
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const stepConfig = action.stepsConfig.getStepConfigOption(step);
    if (stepConfig === undefined) throw new Error("expected step config not found");

    super(step, context, null);
  }
}
