import { Socket } from "socket.io";
import {
  ClientToServerEventTypes,
  GameListEntry,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export default function requestGameListHandler(
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const gameServer = getGameServer();
  const gameList: GameListEntry[] = gameServer.games
    .entries()
    .map(
      ([gameName, game]) =>
        new GameListEntry(
          gameName,
          Object.keys(game.players).length,
          game.mode,
          game.timeStarted,
          game.isRanked
        )
    );
  socket.emit(ServerToClientEvent.GameList, gameList);
}
