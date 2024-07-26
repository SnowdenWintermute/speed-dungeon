import { HpChangeSource } from "../../../combat/hp-change-source-types";
import { NumberRange } from "../../../primatives/number-range";
import {
  EquipmentType,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "../equipment-types";

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
    equipmentType === (EquipmentType.TwoHandedMeleeWeapon || EquipmentType.TwoHandedRangedWeapon)
  );
}
