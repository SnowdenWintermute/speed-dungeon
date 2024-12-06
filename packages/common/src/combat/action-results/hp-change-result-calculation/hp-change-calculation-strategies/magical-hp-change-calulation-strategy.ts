import { BASE_CRIT_CHANCE } from "../../../../app-consts.js";
import { CombatAttribute, CombatantProperties } from "../../../../combatants/index.js";
import { HpChange } from "../../../hp-change-source-types.js";
import getDamageAfterResilience from "../get-damage-after-resilience.js";
import rollCrit from "../roll-crit.js";
import { GenericHpCalculationStrategy } from "./generic-hp-calculation-strategy.js";

export class MagicalHpChangeCalculationStrategy extends GenericHpCalculationStrategy {
  rollCrit(hpChange: HpChange, user: CombatantProperties, _target: CombatantProperties): HpChange {
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    const userFocus = userAttributes[CombatAttribute.Focus];
    const critChance = userFocus + BASE_CRIT_CHANCE;
    hpChange.isCrit = rollCrit(critChance);
    return hpChange;
  }
  applyArmorClass(
    hpChange: HpChange,
    _user: CombatantProperties,
    _target: CombatantProperties
  ): HpChange {
    return hpChange;
  }
  applyResilience(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange {
    if (hpChange.value > 0) return hpChange; // don't apply resilience if being healed
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    const targetAttributes = CombatantProperties.getTotalAttributes(target);
    hpChange.value = getDamageAfterResilience(hpChange.value, userAttributes, targetAttributes);
    return hpChange;
  }
}
