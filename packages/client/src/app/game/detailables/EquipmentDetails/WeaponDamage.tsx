import {
  AffixType,
  Equipment,
  EquipmentType,
  ResourceChangeSource,
  PrefixType,
  SuffixType,
  WeaponProperties,
  AffixCategory,
} from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import React from "react";
import DamageTypeBadge, { DamageTypeBadgeWithIcon } from "../DamageTypeBadge";

interface Props {
  equipment: Equipment;
}

export default function WeaponDamage({ equipment }: Props) {
  let damageOption: null | NumberRange = null;
  let damagetypes: null | ResourceChangeSource[] = null;

  let weaponProperties: WeaponProperties;

  switch (equipment.equipmentBaseItemProperties.equipmentType) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      damageOption = equipment.equipmentBaseItemProperties.damage;
      damagetypes = equipment.equipmentBaseItemProperties.damageClassification;
      weaponProperties = equipment.equipmentBaseItemProperties;
      break;
    default:
      return <></>;
  }
  if (damageOption === null || damagetypes === null) return <></>;

  const modifiedWeaponDamage = Equipment.getModifiedWeaponDamageRange(
    equipment.affixes,
    weaponProperties.damage
  );

  let damageStyles = "";

  if (
    equipment.affixes[AffixCategory.Prefix]?.[AffixType.PercentDamage] !== undefined ||
    equipment.affixes[AffixCategory.Suffix]?.[AffixType.FlatDamage]
  )
    damageStyles = "text-blue-300";

  return (
    <>
      <div
        className={`mb-1 ${damageStyles}`}
      >{`Damage: ${modifiedWeaponDamage.min}-${modifiedWeaponDamage.max}`}</div>
      {damagetypes.length > 0 && (
        <ul className="list-none p-0 w-fit mx-auto flex flex-col items-center">
          {damagetypes.map((item, i) => (
            <div key={i} className="mb-1">
              <DamageTypeBadgeWithIcon hpChangeSource={item} />
            </div>
          ))}
        </ul>
      )}
    </>
  );
}
