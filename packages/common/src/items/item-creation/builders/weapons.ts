import { ResourceChangeSource } from "../../../combat/hp-change-source-types.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { ArrayUtils } from "../../../utils/array-utils.js";
import { WeaponProperties } from "../../equipment/equipment-properties/weapon-properties.js";
import {
  EQUIPMENT_TYPE_STRINGS,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
} from "../../equipment/equipment-types/index.js";
import { WeaponGenerationTemplate } from "../equipment-templates/base-templates.js";
import { AffixGenerator } from "./affix-generator/index.js";
import { EquipmentGenerationBuilder } from "./equipment.js";
import { ItemGenerationBuilder } from "./item.js";
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
    randomNumberGenerator: RandomNumberGenerator,
    affixGenerator: AffixGenerator
  ) {
    super(templates, equipmentType, randomNumberGenerator, affixGenerator);
  }

  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType) {
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    }

    // look up damage range for the base item and roll it
    const template = this.templates[baseEquipmentItem.baseItemType];

    if (template === undefined) {
      return new Error(
        `missing template for equipment type ${EQUIPMENT_TYPE_STRINGS[baseEquipmentItem.equipmentType]}, specific item ${baseEquipmentItem.baseItemType}`
      );
    }

    // roll damageClassifications from possible list
    const damageClassifications: ResourceChangeSource[] = [];
    const shuffledPossibleClassifications = ArrayUtils.shuffle(
      cloneDeep(template.possibleDamageClassifications)
    );

    for (let i = 0; i < template.numDamageClassifications; i += 1) {
      const someClassification = shuffledPossibleClassifications.pop();
      if (someClassification === undefined) {
        return new Error(
          `tried to select more damage classifications than possible ${template.numDamageClassifications} for equipment type ${EQUIPMENT_TYPE_STRINGS[baseEquipmentItem.equipmentType]} specific item ${baseEquipmentItem.baseItemType}`
        );
      }
      damageClassifications.push(someClassification);
    }

    const properties: WeaponProperties = {
      taggedBaseEquipment: baseEquipmentItem,
      equipmentType: baseEquipmentItem.equipmentType,
      damage: template.damage,
      damageClassification: damageClassifications,
    };

    return properties;
  }
}
