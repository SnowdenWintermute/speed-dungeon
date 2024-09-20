import { HpChangeSource } from "../../../combat/hp-change-source-types.js";
import { NumberRange } from "../../../primatives/number-range.js";
import {
  EquipmentType,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "../equipment-types/index.js";

export interface WeaponProperties {
  type:
    | EquipmentType.OneHandedMeleeWeapon
    | EquipmentType.TwoHandedMeleeWeapon
    | EquipmentType.TwoHandedRangedWeapon;
  baseItem: OneHandedMeleeWeapon | TwoHandedMeleeWeapon | TwoHandedRangedWeapon;
  damage: NumberRange;
  damageClassification: HpChangeSource[];
}

export function equipmentIsTwoHandedWeapon(equipmentType: EquipmentType) {
  return (
    equipmentType === EquipmentType.TwoHandedMeleeWeapon ||
    equipmentType === EquipmentType.TwoHandedRangedWeapon
  );
}
