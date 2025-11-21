"use client";
import { IconName, SVG_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { EntityId } from "@speed-dungeon/common";
import React, { useState } from "react";

interface Props {
  portraitHeight: number;
  combatantLevel: number;
  combatantId: EntityId;
  portrait?: string;
}

export default function Portrait({ portrait, portraitHeight, combatantId, combatantLevel }: Props) {
  const [hovered, setHovered] = useState(false);

  function handleFocus() {
    setHovered(true);
  }

  function handleBlur() {
    setHovered(false);
  }

  function handleClick() {
    AppStore.get().gameStore.setFocusedCharacter(combatantId);
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
