import { Item } from ".";
import { CombatAttribute } from "../combatants/combat-attributes";
import { CombatantAttributeRecord } from "../combatants/combatant-properties";

export default function itemRequirementsMet(
  this: Item,
  combatantAttributes: CombatantAttributeRecord
) {
  for (const [key, requiredValue] of Object.entries(this.requirements)) {
    const attribute = parseInt(key) as CombatAttribute;
    const combatantAttributeValue = combatantAttributes[attribute];
    if (!combatantAttributeValue) return false;
    if (combatantAttributeValue < requiredValue) return false;
  }
  return true;
}
