import { CombatAttribute } from "../../../combatants";
import { ConsumableType } from "../../consumables";
import { ItemPropertiesType } from "../../item-properties";
import { Prefix, Suffix } from "../affixes";
import { EquipmentBaseItemProperties } from "../equipment-properties";
import { EquipmentBaseItem, EquipmentType } from "../equipment-types";

export interface ItemGenerationBuilder {
  buildBaseItem: (
    itemType: ItemPropertiesType,
    itemLevel: number
  ) =>
    | { type: ItemPropertiesType.Consumable; baseItem: ConsumableType }
    | {
        type: ItemPropertiesType.Equipment;
        baseItem: { equipmentType: EquipmentType; baseItem: EquipmentBaseItem };
      };
  buildEquipmentBaseItemProperties: (
    baseItem: ConsumableType | { equipmentType: EquipmentType; baseItem: EquipmentBaseItem }
  ) => null | EquipmentBaseItemProperties;
  buildAffixes: (itemLevel: number) => null | [Prefix[], Suffix[]];
  buildRequirements: (
    baseItem: ConsumableType | { equipmentType: EquipmentType; baseItem: EquipmentBaseItem },
    affixes: null | [Prefix[], Suffix[]]
  ) => Partial<Record<CombatAttribute, number>>;
  buildItemName: (
    affixes: null | [Prefix[], Suffix[]],
    baseItem: ConsumableType | { equipmentType: EquipmentType; baseItem: EquipmentBaseItem }
  ) => string;
}
