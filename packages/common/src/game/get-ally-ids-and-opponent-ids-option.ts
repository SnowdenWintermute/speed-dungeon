import { SpeedDungeonGame } from ".";
import { AdventuringParty } from "../adventuring_party";
import { Battle } from "../battle";
import { ERROR_MESSAGES } from "../errors";

export default function getAllyIdsAndOpponentIdsOption(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  combatantId: string
) {
  let allyIds: string[] = party.characterPositions;
  let opponentIdsOption: null | string[] = null;

  if (party.battleId) {
    const battleOption = game.battles[party.battleId];
    if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    const allyAndOponnentIdsResult = Battle.getAllyIdsAndOpponentIdsOption(
      battleOption,
      combatantId
    );
    return allyAndOponnentIdsResult;
  }
  return { allyIds, opponentIdsOption };
}
