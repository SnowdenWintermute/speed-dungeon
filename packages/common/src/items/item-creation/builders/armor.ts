import { ERROR_MESSAGES } from "../../../errors/index.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { randBetween } from "../../../utils/rand-between.js";
import { ArmorProperties } from "../../equipment/equipment-properties/armor-properties.js";
import {
  EQUIPMENT_TYPE_STRINGS,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
} from "../../equipment/equipment-types/index.js";
import { ArmorGenerationTemplate } from "../equipment-templates/base-templates.js";
import { AffixGenerator } from "./affix-generator/index.js";
import { EquipmentGenerationBuilder } from "./equipment.js";
import { ItemGenerationBuilder } from "./item.js";

export class ArmorGenerationBuilder<T extends ArmorGenerationTemplate>
  extends EquipmentGenerationBuilder<T>
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType: EquipmentType.BodyArmor | EquipmentType.HeadGear,
    randomNumberGenerator: RandomNumberGenerator,
    affixGenerator: AffixGenerator
  ) {
    super(templates, equipmentType, randomNumberGenerator, affixGenerator);
  }

  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType) {
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    }

    const template = this.templates[baseEquipmentItem.baseItemType];

    if (template === undefined) {
      const message = `missing template for equipment type ${EQUIPMENT_TYPE_STRINGS[baseEquipmentItem.equipmentType]}, specific item ${baseEquipmentItem.baseItemType}`;
      return new Error(message);
    }

    const armorClass = randBetween(
      template.acRange.min,
      template.acRange.max,
      this.randomNumberGenerator
    );

    const properties: ArmorProperties = {
      taggedBaseEquipment: baseEquipmentItem,
      equipmentType: baseEquipmentItem.equipmentType,
      armorClass,
      armorCategory: template.armorCategory,
    };
    return properties;
  }
}
