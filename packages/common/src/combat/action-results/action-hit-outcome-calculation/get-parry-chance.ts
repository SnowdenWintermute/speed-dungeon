import { CombatantProperties } from "../../../combatants/index.js";
import { Percentage } from "../../../primatives/index.js";

const BASE_PARRY_CHANCE = 5;

export function getParryChance(
  aggressor: CombatantProperties,
  defender: CombatantProperties
): Percentage {
  // derive this from attributes (focus?), traits (parryBonus) and conditions (parryStance)
  return BASE_PARRY_CHANCE;
}
