import { Item } from "../items/index.js";
import { CombatantAttributeRecord } from "./index.js";

export function combatantHasRequiredAttributesToUseItem(
  attributes: CombatantAttributeRecord,
  item: Item
): boolean {
  const requirementsMet = Item.requirementsMet(item, attributes);
  if (!requirementsMet) return false;
  return true;
}
