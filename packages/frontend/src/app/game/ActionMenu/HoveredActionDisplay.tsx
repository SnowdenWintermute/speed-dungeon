import React from "react";
import { ActionDetails } from "../detailables/action-details";
import { CombatActionName } from "@speed-dungeon/common";

interface Props {
  hoveredAction: CombatActionName;
}

export default function HoveredActionDisplay(props: Props) {
  return (
    <div className="pl-2">
      <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2">
        <ActionDetails actionName={props.hoveredAction} />
      </div>
    </div>
  );
}
