import {
  ArmorProperties,
  EQUIPMENT_TYPE_STRINGS,
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
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
        `missing template for equipment type ${EQUIPMENT_TYPE_STRINGS[baseEquipmentItem.equipmentType]}, specific item ${baseEquipmentItem.baseItemType}`
      );

    const armorClass = randBetween(template.acRange.min, template.acRange.max);

    const properties: ArmorProperties = {
      taggedBaseEquipment: baseEquipmentItem,
      equipmentType: baseEquipmentItem.equipmentType,
      armorClass,
      armorCategory: template.armorCategory,
    };
    return properties;
  }
}
