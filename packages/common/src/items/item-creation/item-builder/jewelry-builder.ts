import { JewelryProperties } from "../../equipment/equipment-properties/index.js";
import { EquipmentType } from "../../equipment/equipment-types/index.js";
import { EquipmentBuilder } from "./equipment-builder.js";

export class JewelryBuilder extends EquipmentBuilder<EquipmentType.Ring | EquipmentType.Amulet> {
  protected buildEquipmentBaseItemProperties(): JewelryProperties {
    return { ...this.baseEquipment };
  }
}
