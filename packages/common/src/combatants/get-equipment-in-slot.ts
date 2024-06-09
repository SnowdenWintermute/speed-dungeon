import { EquipmentSlot } from "../items";
import { EquipmentProperties } from "../items/equipment/equipment-properties";
import { ItemPropertiesType } from "../items/item-properties";
import { CombatantProperties } from "./combatant-properties";

export default function getEquipmentInSlot(
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
