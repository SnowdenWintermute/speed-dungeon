import {
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
  HpChangeSource,
  WeaponProperties,
  shuffleArray,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder } from "./item-generation-builder";
import { WeaponGenerationTemplate } from "./equipment-templates/equipment-generation-template-abstract-classes";
import { EquipmentGenerationBuilder } from "./equipment-generation-builder";
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
      | EquipmentType.TwoHandedRangedWeapon,
    public itemLevel: number
  ) {
    super(templates, equipmentType, itemLevel);
  }

  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType)
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

    // look up damage range for the base item and roll it
    const template = this.templates[baseEquipmentItem.baseItemType];
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
      type: this.equipmentType,
      damage: template.damage,
      damageClassification: damageClassifications,
    };
    return properties;
  }
}
