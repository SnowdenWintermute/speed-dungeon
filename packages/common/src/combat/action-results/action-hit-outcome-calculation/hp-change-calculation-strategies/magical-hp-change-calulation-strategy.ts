import { RESILIENCE_TO_PERCENT_MAGICAL_HEALING_INCREASE_RATIO } from "../../../../app-consts.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-actions/combat-action-hit-outcome-properties.js";
import { ResourceChange } from "../../../hp-change-source-types.js";
import getDamageAfterResilience from "../get-damage-after-resilience.js";
import { ResourceChangeCalculationStrategy } from "./index.js";

export class MagicalResourceChangeCalculationStrategy implements ResourceChangeCalculationStrategy {
  applyArmorClass(
    hitOutcomeProperties: CombatActionHitOutcomeProperties,
    hpChange: ResourceChange,
    user: CombatantProperties,
    target: CombatantProperties
  ) {
    return;
  }
  applyResilience(
    hpChange: ResourceChange,
    user: CombatantProperties,
    target: CombatantProperties
  ) {
    if (hpChange.value === 0) return hpChange;
    if (hpChange.value > 0) {
      // don't apply resilience if being healed
      // instead increase the healing done
      const targetCombatAttributes = CombatantProperties.getTotalAttributes(target);
      const targetResilience = targetCombatAttributes[CombatAttribute.Resilience];
      const resilienceMultiplier =
        (targetResilience / 100) * RESILIENCE_TO_PERCENT_MAGICAL_HEALING_INCREASE_RATIO + 1.0;
      hpChange.value *= resilienceMultiplier;
    } else {
      const userAttributes = CombatantProperties.getTotalAttributes(user);
      const targetAttributes = CombatantProperties.getTotalAttributes(target);
      hpChange.value = getDamageAfterResilience(hpChange.value, userAttributes, targetAttributes);
    }
  }
}
