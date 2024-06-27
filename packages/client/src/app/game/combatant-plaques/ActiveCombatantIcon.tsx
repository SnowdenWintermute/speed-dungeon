import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { Battle } from "@speed-dungeon/common";
import React from "react";

interface Props {
  combatantId: string;
  battleOption: null | Battle;
}

export default function ActiveCombatantIcon({ combatantId, battleOption }: Props) {
  const content =
    !battleOption || !Battle.combatantIsFirstInTurnOrder(battleOption, combatantId) ? (
      <></>
    ) : (
      <div className="h-full border border-slate-400 bg-slate-700 pr-2 pl-2 text-sm pointer-events-auto w-fit">
        {"taking turn..."}
      </div>
    );

  return (
    <div className="pt-2" style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}>
      {content}
    </div>
  );
}
