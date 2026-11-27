import { ActionEntity } from "../../action-entities/index.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { SPEED_TIER_BASE_DELAY_RATES, SpeedTier } from "../../combat/turn-order/speed-tiers.js";
import { RandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { invariant } from "../../utils/index.js";
import { ITurnDelayPolicy } from "./index.js";

class ActionEntityTurnDelayPolicy implements ITurnDelayPolicy<ActionEntity> {
  computeBaseTurnDelay(actionUser: ActionEntity) {
    const averageTurnsBetweenTicks =
      actionUser.getActionEntityProperties().actionOriginData?.averageTurnsBetweenTicks;
    invariant(averageTurnsBetweenTicks !== undefined, "expected averageTurnsBetweenTicks");
    invariant(averageTurnsBetweenTicks > 0, "expected positive delay");
    return Math.round(SPEED_TIER_BASE_DELAY_RATES[SpeedTier.Average] * averageTurnsBetweenTicks);
  }

  computeDelayOnTurnEnded(actionUser: ActionEntity, actionName: CombatActionName) {
    return this.computeBaseTurnDelay(actionUser);
  }

  computeDelayOnRegistered(
    actionUser: ActionEntity,
    timelineEntryIndex: number,
    rng: RandomNumberGenerator
  ) {
    return this.computeBaseTurnDelay(actionUser);
  }

  computeBattleTimelineEntryCount(actionUser: ActionEntity) {
    const averageTurnsBetweenTicks =
      actionUser.getActionEntityProperties().actionOriginData?.averageTurnsBetweenTicks;
    return averageTurnsBetweenTicks === undefined ? 0 : 1;
  }

  computeForecastTurnCountLimitOption(actionUser: ActionEntity) {
    return actionUser.getActionEntityProperties().actionOriginData?.stacks?.current ?? null;
  }
}

export const ACTION_ENTITY_TURN_DELAY_POLICY = new ActionEntityTurnDelayPolicy();
