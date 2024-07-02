import { AdventuringParty } from "../adventuring_party";
import { ERROR_MESSAGES } from "../errors";
import { EquipmentSlot } from "../items";
import { EntityId } from "../primatives";
import { CombatantProperties } from "./combatant-properties";

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
