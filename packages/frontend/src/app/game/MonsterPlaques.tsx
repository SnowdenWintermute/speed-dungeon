import { AdventuringParty, SpeedDungeonGame } from "@speed-dungeon/common";
import React from "react";
import CombatantPlaqueGroup from "./combatant-plaques/CombatantPlaqueGroup";
import { observer } from "mobx-react-lite";

interface Props {
  game: SpeedDungeonGame;
  party: AdventuringParty;
}

export const MonsterPlaques = observer(({ party, game }: Props) => {
  let monsterPlaques = <div />;
  if (party.battleId === null) return monsterPlaques;

  const monsterIdsOption = party.combatantManager
    .getDungeonControlledCombatants()
    .map((combatant) => combatant.getEntityId());

  if (monsterIdsOption) {
    monsterPlaques = (
      <CombatantPlaqueGroup
        party={party}
        combatantIds={monsterIdsOption}
        isPlayerControlled={false}
      />
    );
  }

  return monsterPlaques;
});
