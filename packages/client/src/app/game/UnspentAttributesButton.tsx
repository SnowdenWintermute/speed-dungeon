import { CombatantProperties } from "@speed-dungeon/common";
import React from "react";

export default function UnspentAttributesButton({
  combatantProperties,
  handleClick,
}: {
  combatantProperties: CombatantProperties;
  handleClick: () => void;
}) {
  if (combatantProperties.unspentAttributePoints < 1) return <></>;

  return (
    <button
      onClick={handleClick}
      className="bg-ffxipink h-5 w-5 border border-slate-400 text-slate-950 text-lg leading-3 ml-1"
    >
      {"+"}
    </button>
  );
}
