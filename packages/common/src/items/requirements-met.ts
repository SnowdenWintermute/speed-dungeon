import { Item } from "./index.js";
import { CombatantAttributeRecord } from "../combatants/combatant-properties.js";
import { CombatAttribute } from "../attributes/index.js";

export default function itemRequirementsMet(
  item: Item,
  combatantAttributes: CombatantAttributeRecord
) {
  for (const [key, requiredValue] of Object.entries(item.requirements)) {
    const attribute = parseInt(key) as CombatAttribute;
    const combatantAttributeValue = combatantAttributes[attribute];
    if (!combatantAttributeValue) return false;
    if (combatantAttributeValue < requiredValue) return false;
  }
  return true;
}
