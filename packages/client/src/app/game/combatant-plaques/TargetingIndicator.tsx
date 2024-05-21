import React from "react";
import { CombatAction, CombatActionType } from "@speed-dungeon/common";

interface Props {
  combatAction: CombatAction;
}

export default function TargetingIndicator({ combatAction }: Props) {
  const color = combatAction.type === CombatActionType.AbilityUsed ? "yellow-700" : "green-600";
  return (
    <div
      className={`w-0 h-0 border-t-[1.5rem] border-t-${color}
      border-r-[1.5rem] border-r-transparent border-l-[1.5rem] 
      border-l-transparent`}
    />
  );
}
