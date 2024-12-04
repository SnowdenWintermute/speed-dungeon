import { Item, formatEquipmentType } from "@speed-dungeon/common";
import { EquipmentProperties } from "@speed-dungeon/common";
import React from "react";
import { ArmorClassText, getArmorCategoryText } from "./armor";
import WeaponDamage from "./WeaponDamage";
import Durability from "./Durability";
import CombatAttributesAndTraits from "./CombatAttributesAndTraits";
import ItemRequirements from "../ItemRequirements";

interface Props {
  item: Item;
  equipmentProperties: EquipmentProperties;
}

export default function EquipmentDetails({ item, equipmentProperties }: Props) {
  const armorCategoryTextOption = getArmorCategoryText(equipmentProperties);
  return (
    <div className="mr-2">
      {formatEquipmentType(equipmentProperties.equipmentBaseItemProperties.type)}
      {armorCategoryTextOption && armorCategoryTextOption}
      <Durability equipmentProperties={equipmentProperties} />
      <ItemRequirements attributeRequirements={item.requirements} />
      <ArmorClassText equipmentProperties={equipmentProperties} />
      <WeaponDamage equipmentProperties={equipmentProperties} />
      <CombatAttributesAndTraits equipmentProperties={equipmentProperties} />
    </div>
  );
}
