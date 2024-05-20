import { BodyArmor } from "./body-armor";
import { HeadGear } from "./head-gear";

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

export type EquipmentBaseItem = BodyArmor | HeadGear;
