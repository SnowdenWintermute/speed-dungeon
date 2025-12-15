import { AdventuringParty, ERROR_MESSAGES } from "@speed-dungeon/common";
import React, { ReactNode } from "react";
import { CombatantPlaque } from "./CombatantPlaque";

interface Props {
  party: AdventuringParty;
  combatantIds: string[];
  isPlayerControlled: boolean;
  displayCompact?: boolean;
  displayColumn?: boolean;
}

export default function CombatantPlaqueGroup(props: Props) {
  return (
    <ul
      className={`w-full flex ${props.displayColumn ? "flex-col flex-wrap" : ""} list-none ${!props.isPlayerControlled && "justify-center"} `}
    >
      {props.combatantIds.map((id) => {
        const combatantOption = props.party.combatantManager.getCombatantOption(id);
        if (combatantOption === undefined) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND} </div>;
        else {
          const petOption = props.party.petManager.getCombatantSummonedPetOption(
            combatantOption.entityProperties.id
          );

          let petDisplay: ReactNode = null;

          if (petOption) {
            petDisplay = (
              <CombatantPlaque
                extraStyles="mb-2"
                combatant={petOption}
                showExperience={false}
                compactView={props.displayCompact}
              />
            );
          }

          return (
            <li
              key={`plaque-${id}`}
              className={`${!props.displayCompact && " mr-4 last:mr-0 "} box-border flex ${props.isPlayerControlled ? "items-end" : "items-start"}`}
            >
              <div className="flex flex-col items-end justify-end w-full">
                {petDisplay}
                <CombatantPlaque
                  combatant={combatantOption}
                  showExperience={props.isPlayerControlled}
                  compactView={props.displayCompact}
                />
              </div>
            </li>
          );
        }
      })}
    </ul>
  );
}
