import { AdventuringParty } from "../adventuring_party/index.js";
import { EntityId } from "../primatives/index.js";
import { Inventory } from "./inventory.js";
import { CombatantProperties } from "./combatant-properties.js";

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
