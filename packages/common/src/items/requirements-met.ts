import { CombatantAttributeRecord } from "../combatants/index.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { Item } from "./index.js";

export default function itemRequirementsMet(
  item: Item,
  combatantAttributes: CombatantAttributeRecord
) {
  for (const [key, requiredValue] of iterateNumericEnumKeyedRecord(item.requirements)) {
    const combatantAttributeValue = combatantAttributes[key];
    if (!combatantAttributeValue) return false;
    if (combatantAttributeValue < requiredValue) return false;
  }
  return true;
}
