import {
  Affixes,
  BaseItem,
  CombatAttribute,
  ConsumableType,
  EquipmentBaseItem,
  EquipmentBaseItemProperties,
  EquipmentType,
  ItemPropertiesType,
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
      baseItem: EquipmentBaseItem;
    };

export abstract class ItemGenerationBuilder {
  constructor(public itemLevel: number) {}
  abstract buildBaseItem: () => Error | TaggedBaseItem;
  abstract buildEquipmentBaseItemProperties: (
    equipmentBaseItem: EquipmentBaseItem
  ) => Error | EquipmentBaseItemProperties;
  abstract buildDurability: (equipmentBaseItem: EquipmentBaseItem) => Error | null | MaxAndCurrent;
  abstract buildAffixes: (equipmentBaseItem: EquipmentBaseItem) => Affixes;
  abstract buildRequirements: (
    baseItem: TaggedBaseItem,
    affixes: null | Affixes
  ) => Partial<Record<CombatAttribute, number>>;

  abstract buildItemName: (baseItem: TaggedBaseItem, affixes: null | Affixes) => string;
}

export abstract class ItemNamer {
  buildItemName(baseItem: TaggedBaseItem, affixes: null | Affixes) {
    return "";
  }
}
