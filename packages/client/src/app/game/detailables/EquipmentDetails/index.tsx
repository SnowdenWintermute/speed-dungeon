import { CombatantAttributeRecord, formatEquipmentType } from "@speed-dungeon/common";
import { EquipmentProperties } from "@speed-dungeon/common/src/items/equipment/equipment-properties";
import React from "react";
import { ArmorClassText, getArmorCategoryText } from "./armor";
import WeaponDamage from "./WeaponDamage";
import Durability from "./Durability";
import CombatAttributesAndTraits from "./CombatAttributesAndTraits";

interface Props {
  equipmentProperties: EquipmentProperties;
  requirements: CombatantAttributeRecord;
  entityId: string;
  isComparedItem: boolean;
}

export default function EquipmentDetails({
  equipmentProperties,
  requirements,
  entityId,
  isComparedItem,
}: Props) {
  const armorCategoryTextOption = getArmorCategoryText(equipmentProperties);
  return (
    <div>
      {formatEquipmentType(equipmentProperties.equipmentTypeProperties.type)}
      {armorCategoryTextOption && <div>{armorCategoryTextOption}</div>}
      <ArmorClassText equipmentProperties={equipmentProperties} />
      <WeaponDamage equipmentProperties={equipmentProperties} />
      <Durability equipmentProperties={equipmentProperties} />
      <CombatAttributesAndTraits equipmentProperties={equipmentProperties} />
    </div>
  );
}
