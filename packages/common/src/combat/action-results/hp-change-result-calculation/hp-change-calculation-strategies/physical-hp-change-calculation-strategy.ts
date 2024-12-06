import { HpChange } from "..";
import { BASE_CRIT_CHANCE } from "../../../../app-consts.js";
import { CombatAttribute, CombatantProperties } from "../../../../combatants/index.js";
import getDamageAfterArmorClass from "../get-damage-after-armor-class.js";
import rollCrit from "../roll-crit.js";
import { GenericHpCalculationStrategy } from "./generic-hp-calculation-strategy.js";

export class PhysicalHpChangeCalculationStrategy extends GenericHpCalculationStrategy {
  rollCrit(hpChange: HpChange, user: CombatantProperties, _target: CombatantProperties): HpChange {
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    const targetAttributes = CombatantProperties.getTotalAttributes(user);
    const userDexterity = userAttributes[CombatAttribute.Dexterity];
    const targetAgility = targetAttributes[CombatAttribute.Agility];
    const critChance = userDexterity - targetAgility + BASE_CRIT_CHANCE;

    hpChange.isCrit = rollCrit(critChance);
    return hpChange;
  }
  applyArmorClass(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange {
    if (hpChange.value > 0) return hpChange; // don't resist being healed
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    const targetAttributes = CombatantProperties.getTotalAttributes(target);
    hpChange.value = getDamageAfterArmorClass(
      hpChange.value,
      userAttributes,
      targetAttributes,
      hpChange.source.meleeOrRanged
    );
    return hpChange;
  }
  applyResilience(
    hpChange: HpChange,
    _user: CombatantProperties,
    _target: CombatantProperties
  ): HpChange {
    return hpChange;
  }
}
