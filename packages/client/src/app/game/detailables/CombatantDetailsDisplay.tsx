import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import {
  CombatantDetails,
  DISPLAYER,
  TRAIT_DESCRIPTIONS,
  formatCombatantTrait,
} from "@speed-dungeon/common";
import React from "react";

interface Props {
  combatantDetails: CombatantDetails;
}

export default function CombatantDetailsDisplay({ combatantDetails }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const { entityProperties, combatantProperties } = combatantDetails;

  function closeDisplay() {
    mutateGameState((store) => {
      store.detailedEntity = null;
      store.hoveredEntity = null;
    });
  }

  console.log(DISPLAYER["TRAITS"]);

  return (
    <div className="flex justify-between ">
      {
        // <CharacterAttributes
        // combatantProperties={combatantProperties}
        // entityProperties={entityProperties}
        // />
      }
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
          {combatantProperties.traits.map((item) => (
            <li key={item.type}>
              <span className="inline-block h-6 w-6">
                {
                  // <HoverableTooltipWrapper tooltip_text={TRAIT_DESCRIPTIONS[item.type]} >
                  // <span className="cursor-help h-full w-full inline-block">
                  // {"ⓘ "}
                  // </span>
                  // </HoverableTooltipWrapper>
                }
              </span>
              {formatCombatantTrait(item)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
