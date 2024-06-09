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

export function formatArmorCategory(armorCategory: ArmorCategories) {
  switch (armorCategory) {
    case ArmorCategories.Cloth:
      return "Cloth";
    case ArmorCategories.Leather:
      return "Leather";
    case ArmorCategories.Mail:
      return "Mail";
    case ArmorCategories.Plate:
      return "Plate";
  }
}
