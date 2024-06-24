import { AdventuringParty, SpeedDungeonGame } from "@speed-dungeon/common";
import { GameServer, SocketId } from ".";

export function getSocketIdsOfPlayersInOtherParties(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty
): Error | SocketId[] {
  const socketIdsOfPlayersInOtherParties: SocketId[] = [];
  for (const username of Object.keys(game.players)) {
    if (party.playerUsernames.includes(username)) continue;
    const playerSocketResult = this.getSocketIdOfPlayer(game, username);
    if (playerSocketResult instanceof Error) return playerSocketResult;
    socketIdsOfPlayersInOtherParties.push(playerSocketResult);
  }
  return socketIdsOfPlayersInOtherParties;
}
