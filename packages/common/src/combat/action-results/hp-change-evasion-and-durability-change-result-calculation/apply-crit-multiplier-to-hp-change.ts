import { BASE_CRIT_MULTIPLIER } from "../../../app-consts.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import { HpChange } from "../../hp-change-source-types.js";

export function applyCritMultiplier(
  hpChange: HpChange,
  hpChangeProperties: CombatActionHpChangeProperties,
  user: CombatantProperties,
  _target: CombatantProperties
) {
  if (!hpChange.isCrit) return;
  const userAttributes = CombatantProperties.getTotalAttributes(user);

  let critMultiplier = 0;
  if (hpChangeProperties.critMultiplierAttribute !== null) {
    const multiplierAttribute = userAttributes[hpChangeProperties.critMultiplierAttribute] || 0;
    critMultiplier = multiplierAttribute / 100;
  }
  critMultiplier += BASE_CRIT_MULTIPLIER;
  hpChange.value *= critMultiplier;
}
