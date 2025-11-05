import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import { Combatant } from "@speed-dungeon/common";
import React from "react";
import { CharacterAttributes } from "../character-sheet/CharacterAttributes";
import CombatantTraitsDisplay from "./CombatantTraitsDisplay";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";

interface Props {
  combatant: Combatant;
}

export const CombatantDisplay = observer(({ combatant }: Props) => {
  const { combatantProperties } = combatant;

  function closeDisplay() {
    AppStore.get().focusStore.detailables.clear();
  }

  return (
    <div className="flex justify-between ">
      <CharacterAttributes combatant={combatant} showAttributeAssignmentButtons={false} />
      <div className="h-full pl-4 w-1/2">
        <div className="w-full flex justify-end">
          <ButtonBasic onClick={closeDisplay}>{"Close"}</ButtonBasic>
        </div>
        <div className="flex justify-between">
          <span>{"Traits "}</span>
          <span> </span>
        </div>
        <Divider />
        <ul>
          <CombatantTraitsDisplay
            traitProperties={combatantProperties.abilityProperties.getTraitProperties()}
          />
        </ul>
      </div>
    </div>
  );
});
