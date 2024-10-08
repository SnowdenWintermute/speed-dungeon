import { Item } from "../items/index.js";
import { CombatantProperties } from "./combatant-properties.js";

export default function combatantCanUseItem(
  combatantProperties: CombatantProperties,
  item: Item
): boolean {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  return Item.requirementsMet(item, totalAttributes);
}
