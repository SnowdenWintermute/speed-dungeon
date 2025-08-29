import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  PlayerAssociatedData,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { ServerPlayerAssociatedData, SocketEventNextFunction } from ".";
import { getGameServer } from "../../singletons/index.js";
import { Socket } from "socket.io";

export async function playerInGame<T>(
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: T,
  _middlewareProvidedData: PlayerAssociatedData | undefined,
  next: SocketEventNextFunction<T, ServerPlayerAssociatedData>
) {
  const playerDataResult = getPlayerAssociatedData(socket);
  if (playerDataResult instanceof Error) return playerDataResult;

  next(eventData, playerDataResult);
}

export function getPlayerAssociatedData(socket: Socket): Error | ServerPlayerAssociatedData {
  const gameServer = getGameServer();
  const [_socket, session] = gameServer.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socket.id);

  const gameResult = gameServer.getSocketCurrentGame(session);
  if (gameResult instanceof Error) return gameResult;
  const game = gameResult;
  const partyResult = SpeedDungeonGame.getPlayerPartyOption(game, session.username);
  if (partyResult instanceof Error) return partyResult;
  const playerOption = game.players[session.username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  return { session, game, partyOption: partyResult, player: playerOption };
}
