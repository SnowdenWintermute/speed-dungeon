import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { SPEED_TIER_BASE_DELAY_RATES } from "../../combat/turn-order/speed-tiers.js";
import { CombatantTraitType } from "../../combatants/combatant-traits/trait-types.js";
import { Combatant } from "../../combatants/index.js";
import { RandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { ITurnDelayPolicy } from "./index.js";

class CombatantTurnDelayPolicy implements ITurnDelayPolicy<Combatant> {
  computeBaseTurnDelay(actionUser: Combatant) {
    const speedTier = actionUser.getSpeedTier();
    return SPEED_TIER_BASE_DELAY_RATES[speedTier];
  }

  computeDelayOnTurnEnded(actionUser: Combatant, actionName: CombatActionName) {
    const baseDelay = this.computeBaseTurnDelay(actionUser);
    // @TODO - apply delay modifier for the action used
    return baseDelay;
  }

  private rollInitiativeExtraDelay(actionUser: Combatant, rng: RandomNumberGenerator) {
    // @TODO -determine how initiative should be determined
    return 0;
  }

  computeDelayOnRegistered(
    actionUser: Combatant,
    timelineEntryIndex: number,
    rng: RandomNumberGenerator
  ) {
    const baseDelay = this.computeBaseTurnDelay(actionUser);
    const initiativeExtraDelay = this.rollInitiativeExtraDelay(actionUser, rng);
    return baseDelay + initiativeExtraDelay;
  }

  computeBattleTimelineEntryCount(actionUser: Combatant) {
    const { combatantProperties } = actionUser;
    const isPassive = combatantProperties.abilityProperties
      .getTraitProperties()
      .hasTraitType(CombatantTraitType.Passive);

    if (isPassive || actionUser.isStopped()) {
      return 0;
    }

    return actionUser.combatantProperties.explicitBattleTimelineEntryCount ?? 1;
  }

  computeForecastTurnCountLimitOption(actionUser: Combatant) {
    return null;
  }
}

export const COMBATANT_TURN_DELAY_POLICY = new CombatantTurnDelayPolicy();
