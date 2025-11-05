import { IActionUser } from "../../../../action-user-context/action-user.js";
import { CombatantProperties } from "../../../../combatants/combatant-properties.js";
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
    user: IActionUser,
    actionLevel: number,
    target: CombatantProperties
  ) {
    if (hpChange.value > 0) return hpChange; // don't resist being healed
    if (hpChange.value === 0) return hpChange;
    hpChange.value = getDamageAfterArmorClass(
      hpChange.value,
      user,
      actionLevel,
      target,
      hitOutcomeProperties
    );
  }
  applyResilience(_hpChange: ResourceChange, user: IActionUser, _target: CombatantProperties) {
    return;
  }
}
