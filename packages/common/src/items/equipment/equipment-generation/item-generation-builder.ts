import { CombatAttribute } from "../../../combatants";
import { ERROR_MESSAGES } from "../../../errors";
import MaxAndCurrent from "../../../primatives/max-and-current";
import { ConsumableType } from "../../consumables";
import { BaseItem, ItemPropertiesType } from "../../item-properties";
import { Affixes, Prefix, Suffix } from "../affixes";
import { EquipmentBaseItemProperties } from "../equipment-properties";
import { ShieldProperties, ShieldSize } from "../equipment-properties/shield-properties";
import { EquipmentBaseItem, EquipmentType } from "../equipment-types";
import { Shield } from "../equipment-types/shield";

type TaggedBaseItem =
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
  abstract buildBaseItem: () => TaggedBaseItem;
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

abstract class ItemNamer {
  buildItemName(baseItem: BaseItem, affixes: null | Affixes) {
    return "";
  }
}

class ShieldBuilder extends ItemNamer implements ItemGenerationBuilder {
  constructor(public itemLevel: number) {
    super();
  }
  buildBaseItem: () => TaggedBaseItem = function () {
    // select random shield base from those available for this.itemLevel
    return {
      type: ItemPropertiesType.Equipment,
      baseItem: { equipmentType: EquipmentType.Shield, baseEquipmentItem: Shield.Aspis },
    };
  };
  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (!(baseEquipmentItem in Shield)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

    // look up armor class range for the base item and roll it

    const properties: ShieldProperties = {
      type: EquipmentType.Shield,
      baseItem: baseEquipmentItem as Shield,
      size: ShieldSize.Medium,
      armorClass: 122,
    };
    return properties;
  }
  buildDurability(baseItem: BaseItem) {
    // look up durability for the base item and roll the current durability
    return { max: 100, current: 50 };
  }
  buildAffixes(baseItem: BaseItem) {
    // roll rarity
    // roll number of prefixes/suffixes
    // look up valid prefixes and suffixes and their tier levels for shields
    // modify list with any special adjustments for the particular base item
    const affixes: Affixes = { prefixes: [], suffixes: [] };
    return affixes;
  }
  buildRequirements(baseItem: BaseItem, affixes: Affixes | null) {
    // look up requirements based on the base item
    // adjust requirements if any affix has an affect on them
    return {};
  }
}
