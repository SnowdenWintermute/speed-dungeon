import { AdventuringParty } from "@speed-dungeon/common";
import React from "react";
import CombatantPlaque from "./CombatantPlaque";

interface Props {
  party: AdventuringParty;
  combatantIds: string[];
  isPlayerControlled: boolean;
}

export default function CombatantPlaqueGroup(props: Props) {
  return (
    <ul className="w-full flex list-none">
      {props.combatantIds.map((id) => {
        const combatantResult = AdventuringParty.getCombatant(props.party, id);
        if (combatantResult instanceof Error) return <div>{combatantResult.message} </div>;
        else
          return (
            <li key={`plaque-${id}`} className="mr-4 last:mr-0 box-border">
              <CombatantPlaque
                combatant={combatantResult}
                showExperience={props.isPlayerControlled}
              />
            </li>
          );
      })}
    </ul>
  );
}
