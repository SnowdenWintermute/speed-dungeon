import {
  ERROR_MESSAGES,
  EquipmentProperties,
  EquipmentType,
  HpChangeSource,
  WeaponProperties,
} from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import React from "react";
import DamageTypeBadge from "../DamageTypeBadge";

interface Props {
  equipmentProperties: EquipmentProperties;
}

export default function WeaponDamage({ equipmentProperties }: Props) {
  let damageOption: null | NumberRange = null;
  let damagetypes: null | HpChangeSource[] = null;

  let weaponProperties: WeaponProperties;

  switch (equipmentProperties.equipmentBaseItemProperties.type) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      damageOption = equipmentProperties.equipmentBaseItemProperties.damage;
      damagetypes = equipmentProperties.equipmentBaseItemProperties.damageClassification;
      weaponProperties = equipmentProperties.equipmentBaseItemProperties;
      break;
    default:
      return <></>;
  }
  if (damageOption === null || damagetypes === null) return <></>;

  const modifiedWeaponDamage = EquipmentProperties.getModifiedWeaponDamageRange(
    equipmentProperties.affixes,
    weaponProperties.damage
  );

  let damageStyles = "";

  if (modifiedWeaponDamage.min > damageOption.min || modifiedWeaponDamage.max > damageOption.max)
    damageStyles = "text-blue-300";

  return (
    <>
      <div
        className={`mb-1 ${damageStyles}`}
      >{`Damage: ${modifiedWeaponDamage.min}-${modifiedWeaponDamage.max}`}</div>
      {damagetypes.length > 0 && (
        <ul className="list-none p-0 w-fit m-auto flex flex-col items-center">
          {damagetypes.map((item, i) => (
            <DamageTypeBadge key={i} hpChangeSource={item} />
          ))}
        </ul>
      )}
    </>
  );
}
