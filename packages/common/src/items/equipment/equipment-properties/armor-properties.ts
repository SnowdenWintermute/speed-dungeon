import { EquipmentType } from "../equipment-types";
import { BodyArmor } from "../equipment-types/body-armor";
import { HeadGear } from "../equipment-types/head-gear";

export interface ArmorProperties {
  type: EquipmentType.BodyArmor | EquipmentType.HeadGear;
  baseItem: BodyArmor | HeadGear;
  armorCategory: ArmorCategories;
  armorClass: number;
}

export enum ArmorCategories {
  Cloth,
  Leather,
  Mail,
  Plate,
}
