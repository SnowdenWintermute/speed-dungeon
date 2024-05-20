import { HpChangeSource } from "../../../combat/hp-change-source-types";
import NumberRange from "../../../primatives/number-range";
import { EquipmentType } from "../equipment-types";
import { OneHandedMeleeWeapon } from "../equipment-types/one-handed-melee-weapon";
import { TwoHandedMeleeWeapon } from "../equipment-types/two-handed-melee-weapon";
import { TwoHandedRangedWeapon } from "../equipment-types/two-handed-ranged-weapon";

export interface WeaponProperties {
  type:
    | EquipmentType.OneHandedMeleeWeapon
    | EquipmentType.TwoHandedMeleeWeapon
    | EquipmentType.TwoHandedRangedWeapon;
  baseItem: OneHandedMeleeWeapon | TwoHandedMeleeWeapon | TwoHandedRangedWeapon;
  damage: NumberRange;
  damageClassification: HpChangeSource[];
}
