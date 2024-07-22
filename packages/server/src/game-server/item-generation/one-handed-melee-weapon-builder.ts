import {
  Affixes,
  BaseItem,
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
  HpChangeSource,
  ItemPropertiesType,
  MaxAndCurrent,
  OneHandedMeleeWeapon,
  WeaponProperties,
  chooseRandomFromArray,
  randBetween,
  shuffleArray,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder, ItemNamer, TaggedBaseItem } from "./item-generation-builder";
import { ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES } from "./equipment-templates/one-handed-melee-weapon-templates";
import cloneDeep from "lodash.clonedeep";
import { WeaponGenerationTemplate } from "./equipment-templates/equipment-generation-template-abstract-classes";

class WeaponBuilder<T extends EquipmentBaseItemType, U extends WeaponGenerationTemplate>
  extends ItemNamer
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<T, U>,
    public itemLevel: number
  ) {
    super();
  }
  buildBaseItem(): Error | TaggedBaseItem {
    // select random item base from those available for this.itemLevel
    const availableTypesOnThisLevel: U[] = [];
    for (const template of Object.values(this.templates)) {
      if (this.itemLevel <= template.levelRange.min && this.itemLevel >= template.levelRange.max) {
        availableTypesOnThisLevel.push(template.equipmentBaseItem.baseItemType);
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

    const typedBaseEquipmentItem = baseEquipmentItem as OneHandedMeleeWeapon;

    // look up damage range for the base item and roll it
    const template = ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES[typedBaseEquipmentItem];
    // roll damageClassifications from possible list
    let damageClassifications: HpChangeSource[] = [];
    let shuffledPossibleClassifications = shuffleArray(
      cloneDeep(template.possibleDamageClassifications)
    );
    for (let i = 0; i < template.numDamageClassifications; i += 1) {
      const someClassification = shuffledPossibleClassifications.pop();
      if (someClassification === undefined)
        return new Error("tried to select more damage classifications than possible");
      if (shuffledPossibleClassifications.length > 0)
        damageClassifications.push(someClassification);
    }

    const properties: WeaponProperties = {
      type: EquipmentType.OneHandedMeleeWeapon,
      damage: template.damage,
      damageClassification: damageClassifications,
    };
    return properties;
  }
  buildDurability(baseEquipmentItem: EquipmentBaseItem) {
    if (!(baseEquipmentItem in OneHandedMeleeWeapon))
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    const typedBaseEquipmentItem = baseEquipmentItem as OneHandedMeleeWeapon;
    const template = ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES[typedBaseEquipmentItem];

    if (template.durability === null) return null;
    const startingDurability = randBetween(template.durability.min, template.durability.max);
    let durability = new MaxAndCurrent(startingDurability, template.durability.max);

    return durability;
  }
  buildAffixes(baseEquipmentItem: EquipmentBaseItem) {
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
