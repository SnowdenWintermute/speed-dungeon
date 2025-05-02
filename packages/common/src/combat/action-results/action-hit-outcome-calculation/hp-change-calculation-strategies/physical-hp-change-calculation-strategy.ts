import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-actions/combat-action-hit-outcome-properties.js";
import { ResourceChange } from "../../../hp-change-source-types.js";
import getDamageAfterArmorClass from "../get-damage-after-armor-class.js";
import { ResourceChangeCalculationStrategy } from "./index.js";

export class PhysicalResourceChangeCalculationStrategy
  implements ResourceChangeCalculationStrategy
{
  applyArmorClass(
    hitOutcomeProperties: CombatActionHitOutcomeProperties,
    hpChange: ResourceChange,
    user: CombatantProperties,
    target: CombatantProperties
  ) {
    if (hpChange.value > 0) return hpChange; // don't resist being healed
    hpChange.value = getDamageAfterArmorClass(hpChange.value, user, target, hitOutcomeProperties);
  }
  applyResilience(
    _hpChange: ResourceChange,
    _user: CombatantProperties,
    _target: CombatantProperties
  ) {
    return;
  }
}
