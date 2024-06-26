import { EquipmentProperties, EquipmentType, HpChangeSource } from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import React from "react";
import DamageTypeBadge from "../DamageTypeBadge";

interface Props {
  equipmentProperties: EquipmentProperties;
}

export default function WeaponDamage({ equipmentProperties }: Props) {
  let damageOption: null | NumberRange = null;
  let damagetypes: null | HpChangeSource[] = null;

  switch (equipmentProperties.equipmentTypeProperties.type) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      damageOption = equipmentProperties.equipmentTypeProperties.damage;
      damagetypes = equipmentProperties.equipmentTypeProperties.damageClassification;
    default:
  }
  if (damageOption === null || damagetypes === null) return <></>;

  return (
    <div>
      <div className="mb-1">{`Damage: ${damageOption.min}-${damageOption.max}`}</div>
      <ul className="list-none">
        {damagetypes.map((item, i) => (
          <DamageTypeBadge key={i} hpChangeSource={item} />
        ))}
      </ul>
    </div>
  );
}
