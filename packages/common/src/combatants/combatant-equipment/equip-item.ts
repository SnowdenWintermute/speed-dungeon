import { ERROR_MESSAGES } from "../../errors/index.js";
import { EquipmentProperties, EquipmentSlot, Item } from "../../items/index.js";
import { EntityId } from "../../primatives/index.js";
import { Inventory } from "./../inventory.js";
import { CombatantProperties } from "./../combatant-properties.js";
import { CombatAttribute } from "./../combat-attributes.js";

/** 
  
  returns list of item ids unequipped
*/
export function equipItem(
  combatantProperties: CombatantProperties,
  itemId: string,
  equipToAltSlot: boolean
): Error | { idsOfUnequippedItems: EntityId[]; unequippedSlots: EquipmentSlot[] } {
  let itemOption: null | Item = null;

  for (const item of combatantProperties.inventory.items) {
    if (item.entityProperties.id === itemId) {
      itemOption = item;
      break;
    }
  }

  if (itemOption === null) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  const item = itemOption;

  if (!CombatantProperties.canUseItem(combatantProperties, item))
    return new Error(ERROR_MESSAGES.EQUIPMENT.REQUIREMENTS_NOT_MET);

  const attributesBefore = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPoints = attributesBefore[CombatAttribute.Hp];
  const maxMana = attributesBefore[CombatAttribute.Mp];
  const percentOfMaxHitPoints = combatantProperties.hitPoints / maxHitPoints;
  const percentOfMaxMana = combatantProperties.mana / maxMana;

  // @TODO: Check if equiping the item would necessitate unequiping multiple items,
  // (as with equiping a 2h weapon when wielding two 1h items) and
  // if so, check if there is space in the inventory to accomodate unequiping those
  // items. Reject if not.

  const equipmentPropertiesResult = Item.getEquipmentProperties(item);
  if (equipmentPropertiesResult instanceof Error) return equipmentPropertiesResult;
  const equipmentProperties = equipmentPropertiesResult;

  const possibleSlots = EquipmentProperties.getEquipableSlots(equipmentProperties);

  const slot = (() => {
    if (equipToAltSlot && possibleSlots.alternate !== null) return possibleSlots.alternate;
    else return possibleSlots.main;
  })();

  const slotsToUnequipResult = (() => {
    switch (slot) {
      case EquipmentSlot.MainHand:
        if (EquipmentProperties.isTwoHanded(equipmentProperties.equipmentBaseItemProperties.type))
          return [EquipmentSlot.MainHand, EquipmentSlot.OffHand];
        else return [slot];
      case EquipmentSlot.OffHand:
        const itemInMainHandOption = combatantProperties.equipment[EquipmentSlot.MainHand];
        if (itemInMainHandOption !== undefined) {
          const equipmentInMainHandResult = Item.getEquipmentProperties(itemInMainHandOption);
          if (equipmentInMainHandResult instanceof Error) return equipmentInMainHandResult;
          if (
            EquipmentProperties.isTwoHanded(
              equipmentInMainHandResult.equipmentBaseItemProperties.type
            )
          )
            return [EquipmentSlot.MainHand, EquipmentSlot.OffHand];
        }
        return [slot];
      default:
        return [slot];
    }
  })();

  if (slotsToUnequipResult instanceof Error) return slotsToUnequipResult;
  const slotsToUnequip = slotsToUnequipResult;

  const idsOfUnequippedItems = CombatantProperties.unequipSlots(
    combatantProperties,
    slotsToUnequip
  );

  const itemToEquipResult = Inventory.removeItem(
    combatantProperties.inventory,
    item.entityProperties.id
  );
  if (itemToEquipResult instanceof Error) return itemToEquipResult;
  combatantProperties.equipment[slot] = itemToEquipResult;

  const attributesAfter = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPointsAfter = attributesAfter[CombatAttribute.Hp];
  const maxManaAfter = attributesAfter[CombatAttribute.Mp];

  combatantProperties.hitPoints = Math.round(maxHitPointsAfter * percentOfMaxHitPoints);
  combatantProperties.mana = Math.round(maxManaAfter * percentOfMaxMana);
  // CombatantProperties.clampHpAndMpToMax(combatantProperties);

  return { idsOfUnequippedItems, unequippedSlots: slotsToUnequip };
}
