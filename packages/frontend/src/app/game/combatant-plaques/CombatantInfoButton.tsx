import { useClientApplication } from "@/hooks/create-client-application-context";
import { Combatant } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

interface Props {
  combatant: Combatant;
}

export const CombatantInfoButton = observer(({ combatant }: Props) => {
  const clientApplication = useClientApplication();
  const { detailableEntityFocus } = clientApplication;

  function handleClick() {
    detailableEntityFocus.updateDetailedCombatant(combatant);
  }

  function handleMouseEnter() {
    detailableEntityFocus.detailables.setHovered(
      Combatant.createInitialized(combatant.entityProperties, combatant.combatantProperties)
    );
  }

  function handleMouseLeave() {
    detailableEntityFocus.detailables.clearHovered();
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
});
