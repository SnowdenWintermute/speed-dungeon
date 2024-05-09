import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  GameListEntry,
  ServerToClientEvent,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "..";

export default function initiateLobbyEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.RequestsGameList, () => {
    const gameList: GameListEntry[] = Object.entries(this.games).map(
      ([gameName, game]) =>
        new GameListEntry(gameName, game.players.size, game.time_started)
    );
    socket.emit(ServerToClientEvent.GameList, gameList);
  });
}
