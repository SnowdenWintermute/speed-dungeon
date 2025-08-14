import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import { Combatant } from "@speed-dungeon/common";
import React from "react";
import CharacterAttributes from "../character-sheet/CharacterAttributes";
import CombatantTraitsDisplay from "./CombatantTraitsDisplay";

interface Props {
  combatant: Combatant;
}

export default function CombatantDisplay({ combatant }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const { combatantProperties } = combatant;

  function closeDisplay() {
    mutateGameState((store) => {
      store.detailedEntity = null;
      store.hoveredEntity = null;
    });
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
          <CombatantTraitsDisplay traitProperties={combatantProperties.traitProperties} />
        </ul>
      </div>
    </div>
  );
}
