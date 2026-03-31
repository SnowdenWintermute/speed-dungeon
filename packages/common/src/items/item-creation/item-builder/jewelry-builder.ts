import { JewelryProperties } from "../../equipment/equipment-properties/jewelry-properties.js";
import { EquipmentBaseItemProperties } from "../../equipment/equipment-properties/index.js";
import {
  AmuletBaseItemType,
  EquipmentType,
  RingBaseItemType,
} from "../../equipment/equipment-types/index.js";
import { formatRing, formatAmulet } from "../../equipment/equipment-types/jewelry.js";
import { EquipmentBuilder } from "./equipment-builder.js";

type JewelryBaseEquipment = RingBaseItemType | AmuletBaseItemType;

export class JewelryBuilder extends EquipmentBuilder {
  protected defaultName(): string {
    const tagged = this.baseEquipment as JewelryBaseEquipment;
    switch (tagged.equipmentType) {
      case EquipmentType.Ring:
        return formatRing(tagged.baseItemType);
      case EquipmentType.Amulet:
        return formatAmulet(tagged.baseItemType);
    }
  }

  protected buildEquipmentBaseItemProperties(): EquipmentBaseItemProperties {
    const tagged = this.baseEquipment as JewelryBaseEquipment;

    const properties: JewelryProperties = {
      taggedBaseEquipment: tagged,
      equipmentType: tagged.equipmentType,
    };

    return properties;
  }
}
