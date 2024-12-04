import {
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
  HpChangeSource,
  OneHandedMeleeWeapon,
  WeaponProperties,
  formatEquipmentType,
  formatMagicalElement,
  shuffleArray,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder } from "./item-generation-builder.js";
import { WeaponGenerationTemplate } from "./equipment-templates/equipment-generation-template-abstract-classes.js";
import { EquipmentGenerationBuilder } from "./equipment-generation-builder.js";
import cloneDeep from "lodash.clonedeep";

export class WeaponGenerationBuilder<T extends WeaponGenerationTemplate>
  extends EquipmentGenerationBuilder<T>
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType:
      | EquipmentType.OneHandedMeleeWeapon
      | EquipmentType.TwoHandedMeleeWeapon
      | EquipmentType.TwoHandedRangedWeapon
  ) {
    super(templates, equipmentType);
  }

  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType)
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

    // look up damage range for the base item and roll it
    const template = this.templates[baseEquipmentItem.baseItemType];

    if (template === undefined)
      return new Error(
        `missing template for equipment type ${formatEquipmentType(baseEquipmentItem.equipmentType)}, specific item ${baseEquipmentItem.baseItemType}`
      );
    // roll damageClassifications from possible list
    let damageClassifications: HpChangeSource[] = [];
    let shuffledPossibleClassifications = shuffleArray(
      cloneDeep(template.possibleDamageClassifications)
    );

    for (let i = 0; i < template.numDamageClassifications; i += 1) {
      const someClassification = shuffledPossibleClassifications.pop();
      if (someClassification === undefined) {
        return new Error(
          `tried to select more damage classifications than possible ${template.numDamageClassifications} for equipment type ${formatEquipmentType(baseEquipmentItem.equipmentType)} specific item ${baseEquipmentItem.baseItemType}`
        );
      }
      damageClassifications.push(someClassification);
    }

    const properties: WeaponProperties = {
      type: this.equipmentType,
      baseItem: baseEquipmentItem.baseItemType,
      damage: template.damage,
      damageClassification: damageClassifications,
    };
    return properties;
  }
}
