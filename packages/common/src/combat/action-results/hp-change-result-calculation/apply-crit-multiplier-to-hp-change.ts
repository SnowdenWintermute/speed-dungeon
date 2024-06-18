import { BASE_CRIT_MULTIPLIER } from "../../../app_consts";
import { CombatantAttributeRecord } from "../../../combatants";
import { CombatActionHpChangeProperties } from "../../combat-actions";

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
