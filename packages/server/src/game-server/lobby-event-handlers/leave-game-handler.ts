import { LOBBY_CHANNEL, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";

export default function leaveGameHandler(this: GameServer, socketId: string) {
  this.leavePartyHandler(socketId);
  let [socket, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  if (!socketMeta.currentGameName)
    throw new Error(
      "Tried to handle a user leaving a game but they didn't know what game they were in"
    );
  const game = this.games.get(socketMeta.currentGameName);
  if (!game)
    throw new Error(
      "Tried handle a user leaving a game but the game they thought they were in didn't exist"
    );
  game.removePlayer(socketMeta.username);
  const gameNameLeaving = socketMeta.currentGameName;
  socketMeta.currentGameName = null;
  if (game.players.size === 0) this.games.remove(game.name);

  this.removeSocketFromChannel(socketId, SocketNamespaces.Main, gameNameLeaving);
  this.joinSocketToChannel(socketId, SocketNamespaces.Main, LOBBY_CHANNEL);

  if (this.games.get(gameNameLeaving)) {
    this.io
      .of(SocketNamespaces.Main)
      .in(gameNameLeaving)
      .emit
      (ServerToClientEvent.PlayerLeftGame, socketMeta.username);
  }
  socket?.emit(ServerToClientEvent.GameFullUpdate, null)
}