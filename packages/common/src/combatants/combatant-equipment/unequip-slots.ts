import { CombatAttribute } from "../../attributes/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { EquipmentSlotType, TaggedEquipmentSlot } from "../../items/equipment/slots.js";
import { CombatantProperties } from "./../combatant-properties.js";
import { getPreEquipmentChangeHpAndManaPercentage } from "./get-pre-equipment-change-hp-and-mana-percentage.js";
import { CombatantEquipment } from "./index.js";

export function unequipSlots(
  combatantProperties: CombatantProperties,
  slots: TaggedEquipmentSlot[]
) {
  const unequippedItemIds: string[] = [];

  const { percentOfMaxHitPoints, percentOfMaxMana } =
    getPreEquipmentChangeHpAndManaPercentage(combatantProperties);

  for (const slot of slots) {
    let itemOption: Equipment | undefined;

    switch (slot.type) {
      case EquipmentSlotType.Holdable:
        const equippedHoldableHotswapSlot =
          CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
        if (!equippedHoldableHotswapSlot) continue;
        itemOption = equippedHoldableHotswapSlot.holdables[slot.slot];
        delete equippedHoldableHotswapSlot.holdables[slot.slot];
        break;
      case EquipmentSlotType.Wearable:
        itemOption = combatantProperties.equipment.wearables[slot.slot];
        delete combatantProperties.equipment.wearables[slot.slot];
        break;
    }
    if (itemOption === undefined) continue;

    combatantProperties.inventory.equipment.push(itemOption);
    unequippedItemIds.push(itemOption.entityProperties.id);
  }

  const attributesAfter = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPointsAfter = attributesAfter[CombatAttribute.Hp];
  const maxManaAfter = attributesAfter[CombatAttribute.Mp];

  combatantProperties.hitPoints = Math.round(maxHitPointsAfter * percentOfMaxHitPoints);
  combatantProperties.mana = Math.round(maxManaAfter * percentOfMaxMana);

  // CombatantProperties.clampHpAndMpToMax(combatantProperties);

  return unequippedItemIds;
}
