import { EquipmentProperties, formatEquipmentType } from "@speed-dungeon/common";
import React from "react";
import { ArmorClassText } from "./armor";

interface Props {
  equipmentProperties: EquipmentProperties;
}

export default function EquipmentType({ equipmentProperties }: Props) {
  return (
    <div>
      <div className="">
        {formatEquipmentType(equipmentProperties.equipmentBaseItemProperties.type)}
      </div>
      <ArmorClassText equipmentProperties={equipmentProperties} />
    </div>
  );
}
