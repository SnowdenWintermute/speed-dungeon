import { Item } from "../items/index.js";
import { CombatantProperties } from "./index.js";

export function combatantHasRequiredAttributesToUseItem(
  combatantProperties: CombatantProperties,
  item: Item
): boolean {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);

  const requirementsMet = Item.requirementsMet(item, totalAttributes);
  if (!requirementsMet) return false;
  return true;
}
