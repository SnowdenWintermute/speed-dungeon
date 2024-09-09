import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  PlayerAssociatedData,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export default function playerAssociatedDataProvider(
  this: GameServer,
  socketId: string,
  fn: (playerAssociatedData: PlayerAssociatedData) => Error | void
): Error | void {
  const [socket, socketMeta] = this.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socketId);
  if (!socket) return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);

  const gameResult = this.getSocketCurrentGame(socketMeta);
  if (gameResult instanceof Error) return gameResult;
  const game = gameResult;
  const partyResult = SpeedDungeonGame.getPlayerParty(game, socketMeta.username);
  if (partyResult instanceof Error) return partyResult;
  const party = partyResult;
  const playerOption = game.players[socketMeta.username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  // const player = playerOption;

  return fn({ username: socketMeta.username, party, game });
}
