import { BodyArmor } from "./body-armor";
import { HeadGear } from "./head-gear";
import { Jewelry } from "./jewelry";
import { OneHandedMeleeWeapon } from "./one-handed-melee-weapon";
import { Shield } from "./shield";
import { TwoHandedMeleeWeapon } from "./two-handed-melee-weapon";
import { TwoHandedRangedWeapon } from "./two-handed-ranged-weapon";

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
