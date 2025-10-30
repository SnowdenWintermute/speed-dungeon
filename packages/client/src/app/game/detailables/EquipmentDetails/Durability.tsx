import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { Equipment } from "@speed-dungeon/common";
import React from "react";

interface Props {
  equipment: Equipment;
}

export default function Durability({ equipment }: Props) {
  const durability = equipment.getDurability();
  const isJewelry = equipment.isJewelry();

  let isModified = false;
  if (durability !== null && equipment.durability !== null)
    isModified = durability.max > equipment.durability.inherentMax;

  const isBroken = equipment.isBroken();

  const textColor = isBroken ? UNMET_REQUIREMENT_TEXT_COLOR : isModified ? "text-blue-300" : "";

  if (isJewelry) return <></>;
  else if (durability === null) return <div>Indestructable</div>;
  else
    return <div className={textColor}>{`Durability: ${durability.current}/${durability.max}`}</div>;
}
