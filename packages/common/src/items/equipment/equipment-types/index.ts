import { BodyArmor } from "./body-armor";
import { HeadGear } from "./head-gear";
import { Jewelry } from "./jewelry";
import { OneHandedMeleeWeapon } from "./one-handed-melee-weapon";
import { Shield } from "./shield";
import { TwoHandedMeleeWeapon } from "./two-handed-melee-weapon";
import { TwoHandedRangedWeapon } from "./two-handed-ranged-weapon";
export * from "./shield";
export * from "./one-handed-melee-weapon";
export * from "./two-handed-ranged-weapon";
export * from "./two-handed-melee-weapon";
export * from "./body-armor";
export * from "./head-gear";

export enum EquipmentType {
  BodyArmor,
  HeadGear,
  Ring,
  Amulet,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  Shield,
}

export type EquipmentBaseItem =
  | BodyArmor
  | HeadGear
  | OneHandedMeleeWeapon
  | TwoHandedMeleeWeapon
  | TwoHandedRangedWeapon
  | Shield
  | Jewelry;

export function formatEquipmentType(equipmentType: EquipmentType) {
  switch (equipmentType) {
    case EquipmentType.BodyArmor:
      return "Body Armor";
    case EquipmentType.HeadGear:
      return "Head Gear";
    case EquipmentType.Ring:
      return "Ring";
    case EquipmentType.Amulet:
      return "Amulet";
    case EquipmentType.OneHandedMeleeWeapon:
      return "One Handed Melee Weapon";
    case EquipmentType.TwoHandedMeleeWeapon:
      return "Two Handed Melee Weapon";
    case EquipmentType.TwoHandedRangedWeapon:
      return "Two Handed Ranged Weapon";
    case EquipmentType.Shield:
      return "Shield";
  }
}
