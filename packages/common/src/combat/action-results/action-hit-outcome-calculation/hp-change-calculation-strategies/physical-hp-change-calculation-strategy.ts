import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionComponent } from "../../../combat-actions/index.js";
import { HpChange } from "../../../hp-change-source-types.js";
import getDamageAfterArmorClass from "../get-damage-after-armor-class.js";
import { HpChangeCalculationStrategy } from "./index.js";

export class PhysicalHpChangeCalculationStrategy implements HpChangeCalculationStrategy {
  applyArmorClass(
    action: CombatActionComponent,
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties
  ) {
    if (hpChange.value > 0) return hpChange; // don't resist being healed
    hpChange.value = getDamageAfterArmorClass(hpChange.value, user, target, action);
  }
  applyResilience(_hpChange: HpChange, _user: CombatantProperties, _target: CombatantProperties) {
    return;
  }
}
