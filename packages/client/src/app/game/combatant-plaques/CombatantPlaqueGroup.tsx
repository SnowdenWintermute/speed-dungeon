import { AdventuringParty } from "@speed-dungeon/common";
import React from "react";
import CombatantPlaque from "./CombatantPlaque";
import getCombatantInParty from "@speed-dungeon/common/src/adventuring_party/get-combatant-in-party";

interface Props {
  party: AdventuringParty;
  combatantIds: string[];
  showExperience: boolean;
}

export default function CombatantPlaqueGroup(props: Props) {
  return (
    <ul className="w-full flex list-none">
      {props.combatantIds.map((id) => {
        const combatantResult = getCombatantInParty(props.party, id);
        if (combatantResult instanceof Error) return <div>{combatantResult.message} </div>;
        else
          return (
            <li key={`plaque-${id}`} className="mr-4 last:mr-0 box-border">
              <CombatantPlaque entityId={id} showExperience={props.showExperience} />
            </li>
          );
      })}
    </ul>
  );
}
