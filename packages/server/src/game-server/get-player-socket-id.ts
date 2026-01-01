import { ERROR_MESSAGES, SpeedDungeonGame, Username } from "@speed-dungeon/common";
import { GameServerNode, SocketId } from "./index.js";

export default function getSocketIdOfPlayer(
  this: GameServerNode,
  game: SpeedDungeonGame,
  username: Username
): Error | SocketId {
  const playerOption = game.players[username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  const player = playerOption;
  const playerSocketIdsOption = this.socketIdsByUsername.get(player.username);
  if (playerSocketIdsOption === undefined)
    return new Error(ERROR_MESSAGES.SERVER.USERNAME_HAS_NO_SOCKET_IDS);
  for (const playerSocketId of playerSocketIdsOption) {
    const associatedSessionOption = this.connections.get(playerSocketId);
    if (associatedSessionOption === undefined)
      return new Error(ERROR_MESSAGES.SERVER.BROWSER_SESSION_NOT_FOUND);
    if (associatedSessionOption.currentGameName === game.name) return playerSocketId;
  }

  return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);
}
