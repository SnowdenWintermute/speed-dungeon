import { Equipment, EquipmentType } from "@speed-dungeon/common";
import React from "react";

interface Props {
  equipment: Equipment;
}

export default function Durability({ equipment }: Props) {
  const { durability } = equipment;
  const isJewelry =
    equipment.equipmentBaseItemProperties.type === EquipmentType.Ring ||
    equipment.equipmentBaseItemProperties.type === EquipmentType.Amulet;

  if (isJewelry) return <></>;
  else if (durability === null) return <div>Indestructable</div>;
  else return <div>{`Durability: ${durability.current}/${durability.max}`}</div>;
}
