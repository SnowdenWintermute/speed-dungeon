import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  PlayerAssociatedData,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { SocketEventNextFunction } from ".";
import { getGameServer } from "../../index.js";
import { Socket } from "socket.io";

export async function getPlayerAssociatedData<T>(
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: T,
  _middlewareProvidedData: PlayerAssociatedData | undefined,
  next: SocketEventNextFunction<T, PlayerAssociatedData>
) {
  const gameServer = getGameServer();
  const [_socket, socketMeta] = gameServer.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socket.id);

  const gameResult = gameServer.getSocketCurrentGame(socketMeta);
  if (gameResult instanceof Error) return gameResult;
  const game = gameResult;
  const partyResult = SpeedDungeonGame.getPlayerPartyOption(game, socketMeta.username);
  if (partyResult instanceof Error) return partyResult;
  const playerOption = game.players[socketMeta.username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  next(eventData, { player: playerOption, game, partyOption: partyResult });
}
