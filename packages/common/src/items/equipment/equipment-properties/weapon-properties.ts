import { HpChangeSource } from "../../../combat/hp-change-source-types";
import { NumberRange } from "../../../primatives/number-range";
import { EquipmentType } from "../equipment-types";

export interface WeaponProperties {
  type:
    | EquipmentType.OneHandedMeleeWeapon
    | EquipmentType.TwoHandedMeleeWeapon
    | EquipmentType.TwoHandedRangedWeapon;
  damage: NumberRange;
  damageClassification: HpChangeSource[];
}

export function equipmentIsTwoHandedWeapon(equipmentType: EquipmentType) {
  equipmentType === (EquipmentType.TwoHandedMeleeWeapon || EquipmentType.TwoHandedRangedWeapon);
}
