import {
  ClientToServerEventTypes,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { GameServerNode } from "../index.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import SocketIO from "socket.io";

export default function joinPlayerToGame(
  gameServer: GameServerNode,
  game: SpeedDungeonGame,
  session: BrowserTabSession,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const player = new SpeedDungeonPlayer(session.username);
  game.addPlayer(player);

  session.currentGameName = game.name;

  for (const channelName of session.channels) {
    gameServer.removeSocketFromChannel(socket.id, channelName);
  }

  gameServer.joinSocketToChannel(socket.id, game.getChannelName());

  socket.emit(ServerToClientEvent.GameFullUpdate, game.getSerialized());

  gameServer.io
    .of("/")
    .except(socket.id)
    .in(game.getChannelName())
    .emit(ServerToClientEvent.PlayerJoinedGame, session.username);
  return player;
}
