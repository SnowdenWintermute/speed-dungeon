import {
  EquipmentAffixes,
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
  abstract buildDurability: (
    equipmentBaseItem: EquipmentBaseItem
  ) => Error | null | { current: number; inherentMax: number };
  abstract buildAffixes: (
    itemLevel: number,
    equipmentBaseItem: EquipmentBaseItem,
    options?: {
      forcedIsMagical?: boolean;
      forcedNumAffixes?: { prefixes: number; suffixes: number };
    }
  ) => Error | EquipmentAffixes;
  abstract buildRequirements: (
    baseItem: TaggedBaseItem,
    affixes: null | EquipmentAffixes
  ) => Error | Partial<Record<CombatAttribute, number>>;

  abstract buildItemName: (
    taggedBaseItem: TaggedBaseItem,
    affixes: null | EquipmentAffixes
  ) => string;
}
