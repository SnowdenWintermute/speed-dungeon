import { AdventuringParty, ERROR_MESSAGES } from "@speed-dungeon/common";
import React, { ReactNode } from "react";
import { CombatantPlaque } from "./CombatantPlaque";

interface Props {
  party: AdventuringParty;
  combatantIds: string[];
  isPlayerControlled: boolean;
}

export default function CombatantPlaqueGroup(props: Props) {
  return (
    <ul className={`w-full flex list-none ${!props.isPlayerControlled && "justify-center"} `}>
      {props.combatantIds.map((id) => {
        const combatantOption = props.party.combatantManager.getCombatantOption(id);
        if (combatantOption === undefined) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND} </div>;
        else {
          const petOption = props.party.getCombatantSummonedPetOption(
            combatantOption.entityProperties.id
          );

          let petDisplay: ReactNode = null;

          if (petOption) {
            petDisplay = <CombatantPlaque combatant={petOption} showExperience={false} />;
          }

          return (
            <li
              key={`plaque-${id}`}
              className={`mr-4 last:mr-0 box-border flex ${props.isPlayerControlled ? "items-end" : "items-start"}`}
            >
              <div className="flex flex-col items-end justify-end">
                {petDisplay}
                <CombatantPlaque
                  combatant={combatantOption}
                  showExperience={props.isPlayerControlled}
                />
              </div>
            </li>
          );
        }
      })}
    </ul>
  );
}
