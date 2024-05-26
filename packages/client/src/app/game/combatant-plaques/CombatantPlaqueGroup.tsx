import { AdventuringParty } from "@speed-dungeon/common";
import React from "react";
import CombatantPlaque from "./CombatantPlaque";

interface Props {
  party: AdventuringParty;
  combatantIds: string[];
  showExperience: boolean;
}

export default function CombatantPlaqueGroup(props: Props) {
  return (
    <ul className="w-full flex list-none">
      {props.combatantIds.map((id) => {
        const combatantResult = props.party.getCombatant(id);
        if (combatantResult instanceof Error) return <div>{combatantResult.message} </div>;
        else
          return (
            <CombatantPlaque
              key={`plaque-${id}`}
              entityId={id}
              showExperience={props.showExperience}
            />
          );
      })}
    </ul>
  );
}
