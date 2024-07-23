import {
  Affixes,
  CombatAttribute,
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemProperties,
  EquipmentBaseItemType,
  EquipmentType,
  ItemPropertiesType,
  MaxAndCurrent,
  chooseRandomFromArray,
  randBetween,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder, ItemNamer, TaggedBaseItem } from "./item-generation-builder";
import { EquipmentGenerationTemplate } from "./equipment-templates/equipment-generation-template-abstract-classes";

export class EquipmentBuilder<T extends EquipmentGenerationTemplate>
  extends ItemNamer
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType: EquipmentType,
    public itemLevel: number
  ) {
    super();
  }
  buildBaseItem(): Error | TaggedBaseItem {
    // select random item base from those available for this.itemLevel
    const availableTypesOnThisLevel: EquipmentBaseItemType[] = [];
    for (const template of Object.values(this.templates)) {
      if (this.itemLevel >= template.levelRange.min && this.itemLevel <= template.levelRange.max) {
        availableTypesOnThisLevel.push(template.equipmentBaseItem.baseItemType);
      }
    }

    const baseEquipmentItem = chooseRandomFromArray(availableTypesOnThisLevel);
    if (baseEquipmentItem instanceof Error) return baseEquipmentItem;

    const toReturn: TaggedBaseItem = {
      type: ItemPropertiesType.Equipment,
      // @ts-ignore
      baseItem: {
        equipmentType: this.equipmentType,
        baseItemType: baseEquipmentItem,
      },
    };

    return toReturn;
  }

  buildEquipmentBaseItemProperties(
    baseEquipmentItem: EquipmentBaseItem
  ): Error | EquipmentBaseItemProperties {
    return new Error("Not implemented");
  }

  // buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
  //   if (baseEquipmentItem.equipmentType !== this.equipmentType)
  //     return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

  //   // look up damage range for the base item and roll it
  //   const template = this.templates[baseEquipmentItem.baseItemType];
  //   // roll damageClassifications from possible list
  //   let damageClassifications: HpChangeSource[] = [];
  //   let shuffledPossibleClassifications = shuffleArray(
  //     cloneDeep(template.possibleDamageClassifications)
  //   );
  //   for (let i = 0; i < template.numDamageClassifications; i += 1) {
  //     const someClassification = shuffledPossibleClassifications.pop();
  //     if (someClassification === undefined)
  //       return new Error("tried to select more damage classifications than possible");
  //     if (shuffledPossibleClassifications.length > 0)
  //       damageClassifications.push(someClassification);
  //   }

  //   const properties: WeaponProperties = {
  //     type: EquipmentType.OneHandedMeleeWeapon,
  //     damage: template.damage,
  //     damageClassification: damageClassifications,
  //   };
  //   return properties;
  // }

  buildDurability(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType)
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    const template = this.templates[baseEquipmentItem.equipmentType];

    if (template.durability === null) return null;
    const startingDurability = randBetween(template.durability.min, template.durability.max);
    let durability = new MaxAndCurrent(startingDurability, template.durability.max);

    return durability;
  }

  buildAffixes(baseEquipmentItem: EquipmentBaseItem) {
    // roll rarity
    // roll number of prefixes/suffixes
    // look up valid affixes and their tier levels for item type
    // modify list of valid affixes with any special adjustments for the particular base item (certain base items may allow
    // different affixes/tiers than the general base item type)
    const affixes: Affixes = { prefixes: [], suffixes: [] };
    return affixes;
  }

  buildRequirements(
    taggedBaseItem: TaggedBaseItem,
    affixes: Affixes | null
  ): Partial<Record<CombatAttribute, number>> {
    // look up requirements based on the base item
    // adjust requirements if any affix has an affect on them
    const toReturn: Partial<Record<CombatAttribute, number>> = {};
    return toReturn;
  }
}
