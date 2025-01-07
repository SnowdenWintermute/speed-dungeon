import { EQUIPMENT_TYPE_STRINGS, Equipment } from "@speed-dungeon/common";
import React from "react";
import { ArmorClassText } from "./armor";

interface Props {
  equipment: Equipment;
}

export default function EquipmentType({ equipment }: Props) {
  return (
    <div>
      <div className="">
        {EQUIPMENT_TYPE_STRINGS[equipment.equipmentBaseItemProperties.taggedBaseItem.equipmentType]}
      </div>
      <ArmorClassText equipment={equipment} />
    </div>
  );
}
