import {
  Equipment,
  SHIELD_SIZE_BLOCK_RATE,
  SHIELD_SIZE_DAMAGE_REDUCTION,
  ShieldProperties,
} from "@speed-dungeon/common";
import React from "react";

interface Props {
  equipment: Equipment;
}

export default function ShieldInfoDisplay(props: Props) {
  const { equipment } = props;
  const shieldPropertiesOption = equipment.getShieldProperties();
  if (shieldPropertiesOption instanceof Error) {
    return <></>;
  }

  const { size } = shieldPropertiesOption;
  const baseBlockRate = SHIELD_SIZE_BLOCK_RATE[size];
  const baseDamageReduction = SHIELD_SIZE_DAMAGE_REDUCTION[size];

  return (
    <div className="flex flex-col">
      <div>{Math.floor(baseBlockRate * 100)}% Block rate</div>
      <div>-{Math.floor(baseDamageReduction * 100)}% Damage on block</div>
    </div>
  );
}
