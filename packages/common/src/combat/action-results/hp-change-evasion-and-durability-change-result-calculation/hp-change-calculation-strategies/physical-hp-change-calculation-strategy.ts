import { CombatantProperties } from "../../../../combatants/index.js";
import { HpChange } from "../../../hp-change-source-types.js";
import getDamageAfterArmorClass from "../get-damage-after-armor-class.js";
import { HpChangeCalculationStrategy } from "./index.js";

export class PhysicalHpChangeCalculationStrategy implements HpChangeCalculationStrategy {
  applyArmorClass(hpChange: HpChange, user: CombatantProperties, target: CombatantProperties) {
    if (hpChange.value > 0) return hpChange; // don't resist being healed
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    const targetAttributes = CombatantProperties.getTotalAttributes(target);
    hpChange.value = getDamageAfterArmorClass(
      hpChange.value,
      userAttributes,
      targetAttributes,
      hpChange.source.meleeOrRanged
    );
  }
  applyResilience(_hpChange: HpChange, _user: CombatantProperties, _target: CombatantProperties) {
    return;
  }
}
