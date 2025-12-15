import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";
import React from "react";
import CombatantPlaqueGroup from "./combatant-plaques/CombatantPlaqueGroup";

export const NeutralCombatantPlaques = observer(() => {
  const party = AppStore.get().gameStore.getExpectedParty();
  let plaques = <div />;
  if (party.battleId === null) return plaques;

  const combatantIds = party.combatantManager
    .getNeutralCombatants()
    .map((combatant) => combatant.getEntityId());

  plaques = (
    <CombatantPlaqueGroup
      party={party}
      combatantIds={combatantIds}
      isPlayerControlled={false}
      displayCompact={true}
      displayColumn={true}
    />
  );

  return (
    <div className=" relative">
      <div className="max-h-[620px] border flex p-1 right-0 border-blue-300 absolute w-fit">
        {plaques}
      </div>
    </div>
  );

  {
    // <ul className="list-none w-20 max-w-20">
  }
});
