import { SpeedDungeonGame } from "@speed-dungeon/common";

export default function getCurrentBattleOption(game: SpeedDungeonGame, partyName: string) {
  const party = game.adventuringParties[partyName];
  if (party === null) return null;
  if (party.battleId === null) return null;
  return game.battles[party.battleId];
}
