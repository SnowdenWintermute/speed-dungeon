import {
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentType,
} from "../../equipment/equipment-types/index.js";
import { JewelryProperties } from "../../equipment/equipment-properties/jewelry-properties.js";

import { JewelryGenerationTemplate } from "../equipment-templates/jewelry.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { EquipmentGenerationBuilder } from "./equipment.js";
import { ItemGenerationBuilder } from "./item.js";
import { AffixGenerator } from "./affix-generator/index.js";
import { Amulet, Ring } from "../../equipment/equipment-types/jewelry.js";

export class JewelryGenerationBuilder<T extends JewelryGenerationTemplate>
  extends EquipmentGenerationBuilder<T>
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType: EquipmentType.Ring | EquipmentType.Amulet,
    randomNumberGenerator: RandomNumberGenerator,
    affixGenerator: AffixGenerator
  ) {
    super(templates, equipmentType, randomNumberGenerator, affixGenerator);
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
