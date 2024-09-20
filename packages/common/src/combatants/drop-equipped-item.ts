import { AdventuringParty } from "../adventuring_party/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EquipmentSlot } from "../items/index.js";
import { EntityId } from "../primatives/index.js";
import { CombatantProperties } from "./combatant-properties.js";

export default function dropEquippedItem(
  party: AdventuringParty,
  combatantProperties: CombatantProperties,
  slot: EquipmentSlot
): Error | EntityId {
  const itemIdsUnequipped = CombatantProperties.unequipSlots(combatantProperties, [slot]);
  const itemId = itemIdsUnequipped[0];
  if (itemId === undefined) return new Error(ERROR_MESSAGES.EQUIPMENT.NO_ITEM_EQUIPPED);
  const itemDroppedIdResult = CombatantProperties.dropItem(party, combatantProperties, itemId);
  if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;
  return itemId;
}
