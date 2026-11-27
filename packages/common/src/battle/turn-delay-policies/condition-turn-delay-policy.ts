import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { SPEED_TIER_BASE_DELAY_RATES, SpeedTier } from "../../combat/turn-order/speed-tiers.js";
import { CombatantCondition } from "../../conditions/index.js";
import { RandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { invariant } from "../../utils/index.js";
import { ITurnDelayPolicy } from "./index.js";

class CombatantConditionTurnDelayPolicy implements ITurnDelayPolicy<CombatantCondition> {
  computeBaseTurnDelay(actionUser: CombatantCondition) {
    const tickProperties = actionUser.getTickProperties();
    invariant(tickProperties !== undefined, "expected tick properties");
    const averageTurns = tickProperties.getAverageTurnsBetweenTicks(actionUser);
    invariant(averageTurns > 0, "expected positive delay");
    return Math.round(SPEED_TIER_BASE_DELAY_RATES[SpeedTier.Average] * averageTurns);
  }

  computeDelayOnTurnEnded(actionUser: CombatantCondition, actionName: CombatActionName) {
    return this.computeBaseTurnDelay(actionUser);
  }

  computeDelayOnRegistered(
    actionUser: CombatantCondition,
    timelineEntryIndex: number,
    rng: RandomNumberGenerator
  ) {
    return this.computeBaseTurnDelay(actionUser);
  }

  computeBattleTimelineEntryCount(actionUser: CombatantCondition) {
    return actionUser.getTickProperties() === undefined ? 0 : 1;
  }

  computeForecastTurnCountLimitOption(actionUser: CombatantCondition) {
    const tickProperties = actionUser.getTickProperties();
    invariant(tickProperties !== undefined, "expected tick properties");

    const { stacksOption } = actionUser;
    if (stacksOption === undefined) {
      return null;
    }

    return Math.ceil(stacksOption.current / tickProperties.stacksRemovedOnTickCount);
  }
}

export const COMBATANT_CONDITION_TURN_DELAY_POLICY = new CombatantConditionTurnDelayPolicy();
