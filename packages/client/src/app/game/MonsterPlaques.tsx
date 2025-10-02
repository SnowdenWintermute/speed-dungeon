import { AdventuringParty, SpeedDungeonGame } from "@speed-dungeon/common";
import React from "react";
import CombatantPlaqueGroup from "./combatant-plaques/CombatantPlaqueGroup";

interface Props {
  game: SpeedDungeonGame;
  party: AdventuringParty;
}

export default function MonsterPlaques({ party, game }: Props) {
  let monsterPlaques = <div />;
  if (party.battleId === null) return monsterPlaques;

  const monsterIdsOption = party.currentRoom.monsterPositions;

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
}
