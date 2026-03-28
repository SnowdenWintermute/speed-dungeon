import { ItemGenerationBuilder } from "./item.js";
import { EquipmentGenerationBuilder } from "./equipment.js";
import { ShieldGenerationTemplate } from "../equipment-templates/shields.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { randBetween } from "../../../utils/rand-between.js";
import { AffixGenerator } from "./affix-generator/index.js";
import {
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
} from "../../equipment/equipment-types/index.js";
import { ShieldProperties } from "../../equipment/equipment-properties/shield-properties.js";

export class ShieldGenerationBuilder<T extends ShieldGenerationTemplate>
  extends EquipmentGenerationBuilder<T>
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    randomNumberGenerator: RandomNumberGenerator,
    affixGenerator: AffixGenerator
  ) {
    super(templates, EquipmentType.Shield, randomNumberGenerator, affixGenerator);
  }

  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType)
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

    const template = this.templates[baseEquipmentItem.baseItemType];
    if (template.equipmentBaseItem.equipmentType !== EquipmentType.Shield)
      return new Error("invalid template");

    const armorClass = randBetween(
      template.acRange.min,
      template.acRange.max,
      this.randomNumberGenerator
    );

    const properties: ShieldProperties = {
      taggedBaseEquipment: template.equipmentBaseItem,
      equipmentType: template.equipmentBaseItem.equipmentType,
      armorClass,
      size: template.size,
    };
    return properties;
  }
}
