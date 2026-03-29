"use client";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { CombatantId } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";

interface Props {
  portraitHeight: number;
  combatantLevel: number;
  combatantId: CombatantId;
  portrait?: string;
  focusable: boolean;
}

export const Portrait = observer(
  ({ portrait, portraitHeight, combatantId, combatantLevel, focusable }: Props) => {
    const [hovered, setHovered] = useState(false);
    const clientApplication = useClientApplication();
    const { combatantFocus } = clientApplication;

    function handleFocus() {
      if (!focusable) {
        return;
      }
      setHovered(true);
    }

    function handleBlur() {
      if (!focusable) {
        return;
      }
      setHovered(false);
    }

    function handleClick() {
      if (!focusable) {
        return;
      }
      combatantFocus.setFocusedCharacter(combatantId);
    }

    return (
      <div className="relative rounded-full h-full border-1">
        <button
          onBlur={handleBlur}
          onMouseOut={handleBlur}
          onFocus={handleFocus}
          onMouseEnter={handleFocus}
          onClick={handleClick}
          className={`
          ${!focusable ? "cursor-auto" : ""}
          h-full aspect-square mr-2 border border-slate-400 bg-slate-600 rounded-full 
          ${hovered && "border-zinc-300"}
          `}
          style={{ height: `${portraitHeight}px` }}
        >
          {portrait && <img className="h-full object-cover" src={portrait} alt="portrait" />}
        </button>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 border border-slate-400 bg-slate-700 pr-2 pl-2 text-sm flex items-center justify-center">
          {combatantLevel}
        </div>
      </div>
    );
  }
);
