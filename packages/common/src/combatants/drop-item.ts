import { AdventuringParty } from "../adventuring_party";
import { EntityId } from "../primatives";
import { CombatantProperties } from "./combatant-properties";
import { Inventory } from "./inventory";

export default function dropItem(
  party: AdventuringParty,
  combatantProperties: CombatantProperties,
  itemId: string
): Error | EntityId {
  const itemResult = Inventory.removeItem(combatantProperties.inventory, itemId);
  if (itemResult instanceof Error) return itemResult;
  const item = itemResult;
  party.currentRoom.items.push(item);
  return itemId;
}
