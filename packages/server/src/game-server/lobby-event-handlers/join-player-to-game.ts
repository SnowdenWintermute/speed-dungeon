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
  session: BrowserTabSession,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const player = new SpeedDungeonPlayer(session.username);
  game.players[session.username] = player;

  session.currentGameName = game.name;

  for (const channelName of session.channels) {
    gameServer.removeSocketFromChannel(socket.id, channelName);
  }
  gameServer.joinSocketToChannel(socket.id, game.name);

  socket.emit(ServerToClientEvent.GameFullUpdate, game);

  gameServer.io
    .of("/")
    .except(socket.id)
    .in(game.name)
    .emit(ServerToClientEvent.PlayerJoinedGame, session.username);
  return player;
}
