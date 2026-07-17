import { IActionUser } from "../../../../action-user-context/action-user.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-actions/combat-action-hit-outcome-properties.js";
import { ResourceChange } from "../../../hp-change-source-types.js";
import { ResourceChangeCalculationStrategy } from "./index.js";
import { CombatantProperties } from "../../../../combatants/combatant-properties.js";

export class MagicalResourceChangeCalculationStrategy implements ResourceChangeCalculationStrategy {
  applyArmorClass(
    hitOutcomeProperties: CombatActionHitOutcomeProperties,
    hpChange: ResourceChange,
    user: IActionUser,
    actionLevel: number,
    target: CombatantProperties
  ) {
    return;
  }

  applySpirit(hpChange: ResourceChange, user: IActionUser, target: CombatantProperties) {
    if (hpChange.value === 0) return hpChange;

    const { mitigationProperties } = target;

    if (hpChange.value > 0) {
      // don't reduce incoming healing, increase it instead
      hpChange.value *= 1 + mitigationProperties.getMagicalHealingIncrease();
    } else {
      hpChange.value *= 1 - mitigationProperties.getMagicalDamageReduction();
    }
  }
}
