import { BodyArmorBaseItemType, HeadGearBaseItemType } from "../equipment-types/index.js";

export interface ArmorProperties {
  baseItem: BodyArmorBaseItemType | HeadGearBaseItemType;
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
