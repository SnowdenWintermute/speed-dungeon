import {
  Affixes,
  BaseItem,
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentType,
  HpChangeSource,
  HpChangeSourceCategoryType,
  ItemPropertiesType,
  MagicalElement,
  MeleeOrRanged,
  OneHandedMeleeWeapon,
  PhysicalDamageType,
  Shield,
  WeaponProperties,
  chooseRandomFromArray,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder, ItemNamer, TaggedBaseItem } from "./item-generation-builder";
import { ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES } from "./equipment-templates/one-handed-melee-weapon-templates";

class OneHandedMeleeWeaponBuilder extends ItemNamer implements ItemGenerationBuilder {
  constructor(public itemLevel: number) {
    super();
  }
  buildBaseItem(): Error | TaggedBaseItem {
    // select random item base from those available for this.itemLevel
    const availableTypesOnThisLevel: OneHandedMeleeWeapon[] = [];
    for (const template of Object.values(ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES)) {
      if (this.itemLevel <= template.levelRange.min && this.itemLevel >= template.levelRange.max) {
        availableTypesOnThisLevel.push(template.oneHandedWeaponType);
      }
    }

    const baseEquipmentItem = chooseRandomFromArray(availableTypesOnThisLevel);
    if (baseEquipmentItem instanceof Error) return baseEquipmentItem;

    return {
      type: ItemPropertiesType.Equipment,
      baseItem: {
        equipmentType: EquipmentType.OneHandedMeleeWeapon,
        baseEquipmentItem,
      },
    };
  }
  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (!(baseEquipmentItem in OneHandedMeleeWeapon))
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

    // look up damage range for the base item and roll it
    // roll damageClassifications from possible list

    const properties: WeaponProperties = {
      type: EquipmentType.OneHandedMeleeWeapon,
      damage: { min: 1, max: 1 },
      damageClassification: [
        new HpChangeSource(
          {
            type: HpChangeSourceCategoryType.PhysicalDamage,
            meleeOrRanged: MeleeOrRanged.Melee,
          },
          PhysicalDamageType.Blunt,
          MagicalElement.Fire
        ),
      ],
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
    // look up valid affixes and their tier levels for shields
    // modify list of valid affixes with any special adjustments for the particular base item (certain base items may allow
    // different affixes/tiers than the general base item type)
    const affixes: Affixes = { prefixes: [], suffixes: [] };
    return affixes;
  }
  buildRequirements(baseItem: BaseItem, affixes: Affixes | null) {
    // look up requirements based on the base item
    // adjust requirements if any affix has an affect on them
    return {};
  }
}
