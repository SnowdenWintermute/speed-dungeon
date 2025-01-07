import { HpChangeSource } from "../../../combat/hp-change-source-types.js";
import { NumberRange } from "../../../primatives/number-range.js";
import {
  EquipmentType,
  OneHandedMeleeWeaponBaseItemType,
  TwoHandedMeleeWeaponBaseItemType,
  TwoHandedRangedWeaponBaseItemType,
} from "../equipment-types/index.js";

export interface WeaponProperties {
  taggedBaseEquipment:
    | OneHandedMeleeWeaponBaseItemType
    | TwoHandedMeleeWeaponBaseItemType
    | TwoHandedRangedWeaponBaseItemType;
  equipmentType:
    | EquipmentType.OneHandedMeleeWeapon
    | EquipmentType.TwoHandedMeleeWeapon
    | EquipmentType.TwoHandedRangedWeapon;
  damage: NumberRange;
  damageClassification: HpChangeSource[];
}

export function equipmentIsTwoHandedWeapon(equipmentType: EquipmentType) {
  return (
    equipmentType === EquipmentType.TwoHandedMeleeWeapon ||
    equipmentType === EquipmentType.TwoHandedRangedWeapon
  );
}
