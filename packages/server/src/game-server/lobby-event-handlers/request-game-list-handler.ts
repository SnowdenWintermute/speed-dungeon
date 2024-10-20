import { Socket } from "socket.io";
import { GameServer } from "..";
import {
  ClientToServerEventTypes,
  GameListEntry,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";

export default function requestGameListHandler(
  this: GameServer,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const gameList: GameListEntry[] = this.games
    .entries()
    .map(
      ([gameName, game]) =>
        new GameListEntry(gameName, Object.keys(game.players).length, game.timeStarted)
    );
  socket.emit(ServerToClientEvent.GameList, gameList);
}
