import { SpeedDungeonGame } from "@speed-dungeon/common";

export default function getCurrentPartyName(game: SpeedDungeonGame, username: string) {
  const player = game.players[username];
  if (!player) return null;
  return player.partyName;
}
