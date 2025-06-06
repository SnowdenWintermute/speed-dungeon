import { EQUIPMENT_TYPE_STRINGS, Equipment } from "@speed-dungeon/common";
import React from "react";
import { ArmorClassText, getArmorCategoryText } from "./armor";
import WeaponDamage from "./WeaponDamage";
import Durability from "./Durability";
import CombatAttributesAndTraits from "./CombatAttributesAndTraits";
import ItemRequirements from "../ItemRequirements";

interface Props {
  equipment: Equipment;
}

export default function EquipmentDetails({ equipment }: Props) {
  const armorCategoryTextOption = getArmorCategoryText(equipment);
  return (
    <div className="mr-2">
      {
        EQUIPMENT_TYPE_STRINGS[
          equipment.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType
        ]
      }
      {armorCategoryTextOption && armorCategoryTextOption}
      <Durability equipment={equipment} />
      <ItemRequirements attributeRequirements={equipment.requirements} />
      <ArmorClassText equipment={equipment} />
      <WeaponDamage equipment={equipment} />
      <CombatAttributesAndTraits equipment={equipment} />
    </div>
  );
}
