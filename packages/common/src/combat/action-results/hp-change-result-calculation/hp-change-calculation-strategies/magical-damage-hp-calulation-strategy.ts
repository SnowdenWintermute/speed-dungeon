import { HpChange } from "..";
import { BASE_CRIT_CHANCE } from "../../../../app-consts";
import { CombatAttribute, CombatantProperties } from "../../../../combatants";
import getDamageAfterResilience from "../get-damage-after-resilience";
import rollCrit from "../roll-crit";
import GenericHpCalculationStrategy from "./generic-hp-calculation-strategy";

export default class MagicalDamageHpCalculationStrategy extends GenericHpCalculationStrategy {
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
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    const targetAttributes = CombatantProperties.getTotalAttributes(user);
    if (hpChange.value > 0) return hpChange; // don't apply resilience if being healed
    hpChange.value = getDamageAfterResilience(hpChange.value, userAttributes, targetAttributes);
    return hpChange;
  }
}
