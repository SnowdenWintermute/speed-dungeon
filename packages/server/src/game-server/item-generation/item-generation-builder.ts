import {
  Affixes,
  BaseItem,
  CombatAttribute,
  ConsumableType,
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemProperties,
  EquipmentType,
  ItemPropertiesType,
  ShieldProperties,
  ShieldSize,
  Shield,
  MaxAndCurrent,
} from "@speed-dungeon/common";

export type TaggedBaseItem =
  | { type: ItemPropertiesType.Consumable; baseItem: ConsumableType }
  | {
      type: ItemPropertiesType.Equipment;
      // tag the equipment base item with equipment type to distinguish the equipment base
      // item enum values from each other: ex: equipmentType: Shield, baseEquipmentItem: Shields.Aspis
      // otherwise whatever number Shields.Aspis evaluates to is indistinguishable from the same number from
      // another equipment enum
      baseItem: { equipmentType: EquipmentType; baseEquipmentItem: EquipmentBaseItem };
    };

export abstract class ItemGenerationBuilder {
  constructor(public itemLevel: number) {}
  abstract buildBaseItem: () => Error | TaggedBaseItem;
  abstract buildEquipmentBaseItemProperties: (
    equipmentBaseItem: EquipmentBaseItem
  ) => Error | EquipmentBaseItemProperties;
  abstract buildDurability: (baseItem: BaseItem) => null | MaxAndCurrent;
  abstract buildAffixes: (baseEquipmentItem: BaseItem) => null | Affixes;
  abstract buildRequirements: (
    baseItem: BaseItem,
    affixes: null | Affixes
  ) => Partial<Record<CombatAttribute, number>>;

  abstract buildItemName: (baseItem: BaseItem, affixes: null | Affixes) => string;
}

export abstract class ItemNamer {
  buildItemName(baseItem: BaseItem, affixes: null | Affixes) {
    return "";
  }
}
