import { AdventuringParty } from "../../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { TaggedEquipmentSlot } from "../../items/equipment/slots.js";
import { EntityId } from "../../primatives/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export default function dropEquippedItem(
  party: AdventuringParty,
  combatantProperties: CombatantProperties,
  taggedSlot: TaggedEquipmentSlot
): Error | EntityId {
  const itemIdsUnequipped = CombatantProperties.unequipSlots(combatantProperties, [taggedSlot]);
  const itemId = itemIdsUnequipped[0];
  if (itemId === undefined) return new Error(ERROR_MESSAGES.EQUIPMENT.NO_ITEM_EQUIPPED);
  const itemDroppedIdResult = CombatantProperties.dropItem(party, combatantProperties, itemId);
  if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;
  return itemId;
}
