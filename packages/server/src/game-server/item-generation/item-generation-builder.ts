import {
  Affixes,
  CombatAttribute,
  ConsumableType,
  EquipmentBaseItem,
  EquipmentBaseItemProperties,
  ItemType,
  MaxAndCurrent,
} from "@speed-dungeon/common";

export type TaggedBaseItem =
  | { type: ItemType.Consumable; baseItem: ConsumableType }
  | {
      type: ItemType.Equipment;
      // tag the equipment base item with equipment type to distinguish the equipment base
      // item enum values from each other: ex: equipmentType: Shield, baseEquipmentItem: Shields.Aspis
      // otherwise whatever number Shields.Aspis evaluates to is indistinguishable from the same number from
      // another equipment enum
      taggedBaseEquipment: EquipmentBaseItem;
    };

export abstract class ItemGenerationBuilder {
  constructor() {}
  abstract buildBaseItem: (
    itemLevel: number,
    forcedBaseItemOption?: TaggedBaseItem | undefined
  ) => Error | TaggedBaseItem;
  abstract buildEquipmentBaseItemProperties: (
    equipmentBaseItem: EquipmentBaseItem
  ) => Error | EquipmentBaseItemProperties;
  abstract buildDurability: (equipmentBaseItem: EquipmentBaseItem) => Error | null | MaxAndCurrent;
  abstract buildAffixes: (
    itemLevel: number,
    equipmentBaseItem: EquipmentBaseItem,
    options?: {
      forcedIsMagical?: boolean;
      forcedNumAffixes?: { prefixes: number; suffixes: number };
    }
  ) => Error | Affixes;
  abstract buildRequirements: (
    baseItem: TaggedBaseItem,
    affixes: null | Affixes
  ) => Error | Partial<Record<CombatAttribute, number>>;

  abstract buildItemName: (taggedBaseItem: TaggedBaseItem, affixes: null | Affixes) => string;
}
