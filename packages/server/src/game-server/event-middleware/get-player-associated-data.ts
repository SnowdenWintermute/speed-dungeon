import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  PlayerAssociatedData,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { MiddlewareFn } from ".";
import { getGameServer } from "../../index.js";

export const getPlayerAssociatedData: MiddlewareFn<undefined, PlayerAssociatedData> = async (
  socket,
  _eventData,
  _data,
  next
) => {
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

  next(undefined, { player: playerOption, game, partyOption: partyResult });
};
