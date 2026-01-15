import { Socket } from "socket.io";
import {
  ClientToServerEventTypes,
  GameName,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { GameListEntry } from "@speed-dungeon/common";

export default function requestGameListHandler(
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const gameServer = getGameServer();
  const gameList: GameListEntry[] = Array.from(gameServer.games.entries()).map(
    ([gameName, game]) =>
      new GameListEntry(
        gameName as GameName,
        Object.keys(game.players).length,
        game.mode,
        game.getTimeStarted(),
        game.isRanked
      )
  );

  socket.emit(ServerToClientEvent.GameList, gameList);
}
