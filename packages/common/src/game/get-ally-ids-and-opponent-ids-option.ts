import { SpeedDungeonGame } from "./index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { Battle } from "../battle/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export default function getAllyIdsAndOpponentIdsOption(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  combatantId: string
) {
  let allyIds: string[] = party.characterPositions;
  let opponentIdsOption: null | string[] = null;

  if (party.battleId !== null) {
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
