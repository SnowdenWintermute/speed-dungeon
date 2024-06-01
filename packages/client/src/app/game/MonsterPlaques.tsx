import { AdventuringParty, Battle, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import React from "react";
import CombatantPlaqueGroup from "./combatant-plaques/CombatantPlaqueGroup";

interface Props {
  game: SpeedDungeonGame;
  party: AdventuringParty;
}

export default function MonsterPlaques({ party, game }: Props) {
  let monsterPlaques = <div />;
  if (party.battleId) {
    const battleOption = game.battles[party.battleId];
    if (!battleOption) return <div>Battle not found</div>;
    else {
      const firstCharacterId = party.characterPositions[0];
      if (!firstCharacterId) return <div>{ERROR_MESSAGES.PARTY.MISSING_CHARACTERS}</div>;
      const allyAndOpponentIdsResult = Battle.getAllyIdsAndOpponentIdsOption(
        battleOption,
        firstCharacterId
      );
      if (allyAndOpponentIdsResult instanceof Error)
        return <div>{allyAndOpponentIdsResult.message}</div>;

      const monsterIdsOption = allyAndOpponentIdsResult.opponentIdsOption;
      if (monsterIdsOption) {
        monsterPlaques = (
          <CombatantPlaqueGroup
            party={party}
            combatantIds={monsterIdsOption}
            showExperience={false}
          />
        );
      }
    }
  }

  return monsterPlaques;
}
