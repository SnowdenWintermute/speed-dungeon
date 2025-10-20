import { CombatantProperties } from "../combatants/combatant-properties.js";
import { Combatant } from "../combatants/index.js";

export function allCombatantsInGroupAreDead(combatants: Combatant[]): boolean {
  if (combatants.length === 0) return false;
  for (const combatant of combatants) {
    const { combatantProperties } = combatant;
    const isDead = CombatantProperties.isDead(combatantProperties);
    const isAlive = !isDead;
    if (isAlive) return false;
  }

  return true;
}
