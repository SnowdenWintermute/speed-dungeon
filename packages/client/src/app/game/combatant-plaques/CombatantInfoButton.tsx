import { AppStore } from "@/mobx-stores/app-store";
import { Combatant } from "@speed-dungeon/common";
import React from "react";

interface Props {
  combatant: Combatant;
}

export default function CombatantInfoButton({ combatant }: Props) {
  const { focusStore } = AppStore.get();

  function handleClick() {
    focusStore.updateDetailedCombatant(combatant);
  }

  function handleMouseEnter() {
    focusStore.setHovered(new Combatant(combatant.entityProperties, combatant.combatantProperties));
  }

  function handleMouseLeave() {
    focusStore.clearHovered();
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="hover:bg-slate-950 hover:border-slate-400 rounded-full leading-4"
    >
      {"ⓘ "}
    </button>
  );
}
