import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../primatives/index.js";
import { Inventory } from "./index.js";
import { CombatantProperties } from "../index.js";

export function dropItem(
  party: AdventuringParty,
  combatantProperties: CombatantProperties,
  itemId: string
): Error | EntityId {
  const itemResult = Inventory.removeItem(combatantProperties.inventory, itemId);
  if (itemResult instanceof Error) return itemResult;
  const item = itemResult;
  const maybeError = party.currentRoom.inventory.insertItem(item);
  if (maybeError instanceof Error) return maybeError;
  return itemId;
}
