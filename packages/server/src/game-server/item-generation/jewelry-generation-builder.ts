import {
  JewelryProperties,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
  Amulet,
  Ring,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder } from "./item-generation-builder.js";
import { EquipmentGenerationBuilder } from "./equipment-generation-builder.js";
import { JewelryGenerationTemplate } from "./equipment-templates/jewelry-generation-templates.js";

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
    const properties = {
      equipmentType: this.equipmentType,
      taggedBaseEquipment: {
        equipmentType: this.equipmentType,
        baseItemType: this.equipmentType === EquipmentType.Amulet ? Amulet.Amulet : Ring.Ring,
      },
    };
    return properties as unknown as JewelryProperties;
  }
}
