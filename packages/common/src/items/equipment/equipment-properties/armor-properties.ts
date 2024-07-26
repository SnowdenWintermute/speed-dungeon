import { EquipmentType } from "../equipment-types";
import { BodyArmor } from "../equipment-types/body-armor";
import { HeadGear } from "../equipment-types/head-gear";

export interface ArmorProperties {
  type: EquipmentType.BodyArmor | EquipmentType.HeadGear;
  baseItem: BodyArmor | HeadGear;
  armorCategory: ArmorCategory;
  armorClass: number;
}

export enum ArmorCategory {
  Cloth,
  Leather,
  Mail,
  Plate,
}

export function formatArmorCategory(armorCategory: ArmorCategory) {
  switch (armorCategory) {
    case ArmorCategory.Cloth:
      return "Cloth";
    case ArmorCategory.Leather:
      return "Leather";
    case ArmorCategory.Mail:
      return "Mail";
    case ArmorCategory.Plate:
      return "Plate";
  }
}
