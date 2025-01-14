import { AdventuringParty } from "../adventuring-party/index.js";
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
  const maybeError = Inventory.insertItem(party.currentRoom.inventory, item);
  if (maybeError instanceof Error) return maybeError;
  return itemId;
}
