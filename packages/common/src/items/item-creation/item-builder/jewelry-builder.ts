import { JewelryProperties } from "../../equipment/equipment-properties/index.js";
import { EquipmentType } from "../../equipment/equipment-types/index.js";
import { formatRing, formatAmulet } from "../../equipment/equipment-types/jewelry.js";
import { EquipmentBuilder } from "./equipment-builder.js";

export class JewelryBuilder extends EquipmentBuilder<
  EquipmentType.Ring | EquipmentType.Amulet
> {
  protected defaultName(): string {
    switch (this.baseEquipment.equipmentType) {
      case EquipmentType.Ring:
        return formatRing(this.baseEquipment.baseItemType);
      case EquipmentType.Amulet:
        return formatAmulet(this.baseEquipment.baseItemType);
    }
  }

  protected buildEquipmentBaseItemProperties(): JewelryProperties {
    return { ...this.baseEquipment };
  }
}
