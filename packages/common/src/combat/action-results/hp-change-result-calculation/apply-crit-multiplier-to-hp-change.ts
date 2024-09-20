import { BASE_CRIT_MULTIPLIER } from "../../../app_consts.js";
import { CombatantAttributeRecord } from "../../../combatants/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";

export default function applyCritMultiplierToHpChange(
  hpChangeProperties: CombatActionHpChangeProperties,
  userCombatantAttributes: CombatantAttributeRecord,
  hpChange: number
): number {
  let critMultiplier = 0;
  if (hpChangeProperties.critMultiplierAttribute !== null) {
    const multiplierAttribute =
      userCombatantAttributes[hpChangeProperties.critMultiplierAttribute] || 0;
    critMultiplier = multiplierAttribute / 100;
  }
  critMultiplier += BASE_CRIT_MULTIPLIER;
  return hpChange * critMultiplier;
}
