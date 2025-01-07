import { ERROR_MESSAGES } from "../../errors/index.js";
import { EntityId } from "../../primatives/index.js";
import { Inventory } from "./../inventory.js";
import { CombatantProperties } from "./../combatant-properties.js";
import { CombatAttribute } from "../../attributes/index.js";
import {
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
} from "../../items/equipment/slots.js";
import { Equipment } from "../../items/equipment/index.js";
import { CombatantEquipment } from "./index.js";
import { getPreEquipmentChangeHpAndManaPercentage } from "./get-pre-equipment-change-hp-and-mana-percentage.js";

/** 
  
  returns list of item ids unequipped
*/
export function equipItem(
  combatantProperties: CombatantProperties,
  itemId: string,
  equipToAltSlot: boolean
): Error | { idsOfUnequippedItems: EntityId[]; unequippedSlots: TaggedEquipmentSlot[] } {
  const equipmentResult = Inventory.getEquipmentById(combatantProperties.inventory, itemId);
  if (equipmentResult instanceof Error) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  const equipment = equipmentResult;

  if (!CombatantProperties.canUseItem(combatantProperties, equipment))
    return new Error(ERROR_MESSAGES.EQUIPMENT.REQUIREMENTS_NOT_MET);

  const { percentOfMaxHitPoints, percentOfMaxMana } =
    getPreEquipmentChangeHpAndManaPercentage(combatantProperties);

  // @TODO: Check if equiping the item would necessitate unequiping multiple items,
  // (as with equiping a 2h weapon when wielding two 1h items) and
  // if so, check if there is space in the inventory to accomodate unequiping those
  // items. Reject if not.
  //
  const { equipmentType } = equipment.equipmentBaseItemProperties.taggedBaseEquipment;

  const possibleSlots = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];

  const slot = (() => {
    if (equipToAltSlot && possibleSlots.alternate !== null) return possibleSlots.alternate;
    else return possibleSlots.main;
  })();

  const slotsToUnequipResult = ((): TaggedEquipmentSlot[] => {
    switch (slot.type) {
      case EquipmentSlotType.Holdable:
        switch (slot.slot) {
          case HoldableSlotType.MainHand:
            if (Equipment.isTwoHanded(equipmentType))
              return [
                { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand },
                { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand },
              ];
            else return [slot];
          case HoldableSlotType.OffHand:
            const equippedHotswapSlot =
              CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
            if (!equippedHotswapSlot) return [];
            const itemInMainHandOption = equippedHotswapSlot.holdables[HoldableSlotType.MainHand];
            if (itemInMainHandOption !== undefined) {
              if (Equipment.isTwoHanded(equipmentType))
                return [
                  { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand },
                  { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand },
                ];
            }
            return [slot];
        }
      case EquipmentSlotType.Wearable:
        return [slot];
    }
  })();

  if (slotsToUnequipResult instanceof Error) return slotsToUnequipResult;
  const slotsToUnequip = slotsToUnequipResult;

  const idsOfUnequippedItems = CombatantProperties.unequipSlots(
    combatantProperties,
    slotsToUnequip
  );

  const itemToEquipResult = Inventory.removeEquipment(
    combatantProperties.inventory,
    equipment.entityProperties.id
  );
  if (itemToEquipResult instanceof Error) return itemToEquipResult;

  const maybeError = CombatantEquipment.putEquipmentInSlot(
    combatantProperties,
    itemToEquipResult,
    slot
  );
  if (maybeError instanceof Error) return maybeError;

  const attributesAfter = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPointsAfter = attributesAfter[CombatAttribute.Hp];
  const maxManaAfter = attributesAfter[CombatAttribute.Mp];

  combatantProperties.hitPoints = Math.round(maxHitPointsAfter * percentOfMaxHitPoints);
  combatantProperties.mana = Math.round(maxManaAfter * percentOfMaxMana);
  // CombatantProperties.clampHpAndMpToMax(combatantProperties);

  return { idsOfUnequippedItems, unequippedSlots: slotsToUnequip };
}
