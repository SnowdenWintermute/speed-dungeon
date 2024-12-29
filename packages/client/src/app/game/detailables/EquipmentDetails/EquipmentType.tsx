import { Equipment, formatEquipmentType } from "@speed-dungeon/common";
import React from "react";
import { ArmorClassText } from "./armor";

interface Props {
  equipment: Equipment;
}

export default function EquipmentType({ equipment }: Props) {
  return (
    <div>
      <div className="">{formatEquipmentType(equipment.equipmentBaseItemProperties.type)}</div>
      <ArmorClassText equipment={equipment} />
    </div>
  );
}
