import { ERROR_MESSAGES } from "../../errors/index.js";
import { EntityId } from "../../primatives/index.js";
import {
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  EquipableSlots,
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
} from "../../items/equipment/slots.js";
import { Equipment } from "../../items/equipment/index.js";
import {
  applyEquipmentEffectWhileMaintainingResourcePercentages,
  CombatantEquipment,
} from "./index.js";
import { getPreEquipmentChangeHpAndManaPercentage } from "./get-pre-equipment-change-hp-and-mana-percentage.js";
import { CombatantProperties, Inventory } from "../index.js";
import { CombatAttribute } from "../attributes/index.js";

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

  if (!CombatantProperties.combatantHasRequiredAttributesToUseItem(combatantProperties, equipment))
    return new Error(ERROR_MESSAGES.EQUIPMENT.REQUIREMENTS_NOT_MET);
  if (Equipment.isBroken(equipment)) return new Error(ERROR_MESSAGES.EQUIPMENT.IS_BROKEN);

  const idsOfUnequippedItems: EntityId[] = [];
  const slotsToUnequip: TaggedEquipmentSlot[] = [];

  applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
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
                if (
                  Equipment.isTwoHanded(equipmentType) ||
                  Equipment.isTwoHanded(
                    itemInMainHandOption.equipmentBaseItemProperties.equipmentType
                  )
                ) {
                  return [
                    { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand },
                    { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand },
                  ];
                }
              }
              return [slot];
          }
        case EquipmentSlotType.Wearable:
          return [slot];
      }
    })();

    if (slotsToUnequipResult instanceof Error) return slotsToUnequipResult;
    slotsToUnequip.push(...slotsToUnequipResult);

    idsOfUnequippedItems.push(
      ...CombatantProperties.unequipSlots(combatantProperties, slotsToUnequip)
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
  });

  return { idsOfUnequippedItems, unequippedSlots: slotsToUnequip };
}
