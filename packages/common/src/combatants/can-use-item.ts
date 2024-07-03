import { Item } from "../items";
import { CombatantProperties } from "./combatant-properties";

export default function combatantCanUseItem(
  combatantProperties: CombatantProperties,
  item: Item
): boolean {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  return Item.requirementsMet(item, totalAttributes);
}
