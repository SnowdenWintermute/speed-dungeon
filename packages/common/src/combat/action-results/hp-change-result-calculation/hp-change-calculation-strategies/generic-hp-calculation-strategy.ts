import { HpChangeCalculationStrategy } from ".";
import { HpChange } from "..";
import { CombatantProperties } from "../../../../combatants";
import { CombatActionHpChangeProperties } from "../../../combat-actions";
import applyAffinityToHpChange from "../apply-affinity-to-hp-change";
import applyCritMultiplierToHpChange from "../apply-crit-multiplier-to-hp-change";
import getDamageAfterResilience from "../get-damage-after-resilience";

export default class GenericHpCalculationStrategy implements HpChangeCalculationStrategy {
  rollCrit(hpChange: HpChange, user: CombatantProperties, _target: CombatantProperties): HpChange {
    throw new Error("Not implemented");
  }
  applyCritMultiplier(
    hpChange: HpChange,
    hpChangeProperties: CombatActionHpChangeProperties,
    user: CombatantProperties,
    _target: CombatantProperties
  ): HpChange {
    if (hpChange.isCrit) return hpChange;
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    hpChange.value = applyCritMultiplierToHpChange(
      hpChangeProperties,
      userAttributes,
      hpChange.value
    );
    return hpChange;
  }
  applyKineticAffinities(hpChange: HpChange, target: CombatantProperties): HpChange {
    const kineticDamageType = hpChange.source.kineticDamageTypeOption;
    if (kineticDamageType === undefined) return hpChange;
    const targetAffinities =
      CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(target);
    const affinityValue = targetAffinities[kineticDamageType] || 0;
    hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
    return hpChange;
  }
  applyElementalAffinities(hpChange: HpChange, target: CombatantProperties): HpChange {
    const hpChangeElement = hpChange.source.elementOption;
    if (hpChangeElement === undefined) return hpChange;
    const targetAffinities = CombatantProperties.getCombatantTotalElementalAffinities(target);
    const affinityValue = targetAffinities[hpChangeElement] || 0;
    hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
    return hpChange;
  }
  applyArmorClass(
    hpChange: HpChange,
    _user: CombatantProperties,
    _target: CombatantProperties
  ): HpChange {
    throw new Error("Not implemented");
  }
  applyResilience(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange {
    throw new Error("Not implemented");
  }
}
