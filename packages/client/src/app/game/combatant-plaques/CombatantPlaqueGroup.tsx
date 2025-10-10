import { AdventuringParty, ERROR_MESSAGES } from "@speed-dungeon/common";
import React from "react";
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
        else
          return (
            <li key={`plaque-${id}`} className="mr-4 last:mr-0 box-border">
              <CombatantPlaque
                combatant={combatantOption}
                showExperience={props.isPlayerControlled}
              />
            </li>
          );
      })}
    </ul>
  );
}
