import { Battle, ERROR_MESSAGES, PartyName, SpeedDungeonGame } from "@speed-dungeon/common";

export default function getCurrentBattleOption(
  game: SpeedDungeonGame,
  partyName: PartyName
): Error | null | Battle {
  const party = game.adventuringParties[partyName];
  if (party === undefined) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  if (party === null) return null;
  if (party.battleId === null) return null;
  const battleOption = game.battles[party.battleId];
  if (battleOption === undefined) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
  return battleOption;
}
