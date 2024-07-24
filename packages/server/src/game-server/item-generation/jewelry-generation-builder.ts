import {
  JewelryProperties,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder } from "./item-generation-builder";
import { EquipmentGenerationBuilder } from "./equipment-generation-builder";
import { JewelryGenerationTemplate } from "./equipment-templates/jewelry-generation-templates";

export class JewelryGenerationBuilder<T extends JewelryGenerationTemplate>
  extends EquipmentGenerationBuilder<T>
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType: EquipmentType.Ring | EquipmentType.Amulet
  ) {
    super(templates, equipmentType);
  }

  buildEquipmentBaseItemProperties(_baseEquipmentItem: EquipmentBaseItem) {
    const properties: JewelryProperties = {
      type: this.equipmentType,
    };
    return properties;
  }
}
