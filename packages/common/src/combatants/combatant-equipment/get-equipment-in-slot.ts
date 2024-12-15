import { EquipmentSlot } from "../../items/index.js";
import { EquipmentProperties } from "../../items/equipment/equipment-properties/index.js";
import { ItemPropertiesType } from "../../items/item-properties.js";
import { CombatantProperties } from "./../combatant-properties.js";

export function getEquipmentInSlot(
  combatantProperties: CombatantProperties,
  slot: EquipmentSlot
): EquipmentProperties | undefined {
  const itemOption = combatantProperties.equipment[slot];
  if (!itemOption) return undefined;
  switch (itemOption.itemProperties.type) {
    case ItemPropertiesType.Equipment:
      return itemOption.itemProperties.equipmentProperties;
    case ItemPropertiesType.Consumable:
      return undefined;
  }
}
