import { EquipmentProperties, EquipmentType } from "@speed-dungeon/common";
import React from "react";

interface Props {
  equipmentProperties: EquipmentProperties;
}

export default function Durability({ equipmentProperties }: Props) {
  const { durability } = equipmentProperties;
  const isJewelry =
    equipmentProperties.equipmentTypeProperties.type === EquipmentType.Ring ||
    equipmentProperties.equipmentTypeProperties.type === EquipmentType.Amulet;

  if (isJewelry) return <></>;
  if (equipmentProperties.durability === null) return <div>Indestructable</div>;
  else return <div>{`Durability: ${durability.current}/${durability.max}`}</div>;
}
