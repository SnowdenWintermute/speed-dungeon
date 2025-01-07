import {
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
  ShieldProperties,
  randBetween,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder } from "./item-generation-builder.js";
import { EquipmentGenerationBuilder } from "./equipment-generation-builder.js";
import { ShieldGenerationTemplate } from "./equipment-templates/shield-templates.js";

export class ShieldGenerationBuilder<T extends ShieldGenerationTemplate>
  extends EquipmentGenerationBuilder<T>
  implements ItemGenerationBuilder
{
  constructor(public templates: Record<EquipmentBaseItemType, T>) {
    super(templates, EquipmentType.Shield);
  }

  buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType)
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

    const template = this.templates[baseEquipmentItem.baseItemType];
    if (template.equipmentBaseItem.equipmentType !== EquipmentType.Shield)
      return new Error("invalid template");

    const armorClass = randBetween(template.acRange.min, template.acRange.max);

    const properties: ShieldProperties = {
      taggedBaseEquipment: template.equipmentBaseItem,
      equipmentType: template.equipmentBaseItem.equipmentType,
      armorClass,
      size: template.size,
    };
    return properties;
  }
}
