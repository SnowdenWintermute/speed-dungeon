import {
  ArmorProperties,
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
  formatEquipmentType,
  randBetween,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder } from "./item-generation-builder.js";
import { ArmorGenerationTemplate } from "./equipment-templates/equipment-generation-template-abstract-classes.js";
import { EquipmentGenerationBuilder } from "./equipment-generation-builder.js";

export class ArmorGenerationBuilder<T extends ArmorGenerationTemplate>
  extends EquipmentGenerationBuilder<T>
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType: EquipmentType.BodyArmor | EquipmentType.HeadGear
  ) {
    super(templates, equipmentType);
  }

  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType)
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

    const template = this.templates[baseEquipmentItem.baseItemType];

    if (template === undefined)
      return new Error(
        `missing template for equipment type ${formatEquipmentType(baseEquipmentItem.equipmentType)}, specific item ${baseEquipmentItem.baseItemType}`
      );

    const armorClass = randBetween(template.acRange.min, template.acRange.max);

    const properties: ArmorProperties = {
      type: this.equipmentType,
      baseItem: baseEquipmentItem.baseItemType,
      armorClass,
      armorCategory: template.armorCategory,
    };
    return properties;
  }
}
