import {
  ClientToServerEventTypes,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import SocketIO from "socket.io";

export default function joinPlayerToGame(
  gameServer: GameServer,
  game: SpeedDungeonGame,
  socketMeta: BrowserTabSession,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  game.players[socketMeta.username] = new SpeedDungeonPlayer(socketMeta.username);

  socketMeta.currentGameName = game.name;

  gameServer.removeSocketFromChannel(socket.id, socketMeta.channelName);
  gameServer.joinSocketToChannel(socket.id, game.name);

  socket.emit(ServerToClientEvent.GameFullUpdate, game);

  gameServer.io
    .of("/")
    .except(socket.id)
    .in(game.name)
    .emit(ServerToClientEvent.PlayerJoinedGame, socketMeta.username);
}