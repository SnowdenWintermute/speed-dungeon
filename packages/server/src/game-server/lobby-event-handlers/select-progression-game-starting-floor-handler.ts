import { ERROR_MESSAGES, GameMode, ServerToClientEvent } from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware";
import { Socket } from "socket.io";
import { getGameServer } from "../../singletons.js";

const ATTEMPT_TEXT = "A client tried to select a saved character but";

export default async function selectProgressionGameStartingFloorHandler(
  floorNumber: number,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const { game, session } = playerAssociatedData;
  if (game.mode !== GameMode.Progression) return errorHandler(socket, ERROR_MESSAGES.GAME.MODE);
  if (game.selectedStartingFloor.max < floorNumber)
    return errorHandler(socket, ERROR_MESSAGES.GAME.STARTING_FLOOR_LIMIT);
  game.selectedStartingFloor.current = floorNumber;
  for (const party of Object.values(game.adventuringParties))
    party.currentFloor = game.selectedStartingFloor.current;

  const player = game.players[session.username];
  if (!player) return errorHandler(socket, `${ATTEMPT_TEXT} their player wasn't in the game`);
  if (!player.partyName) return errorHandler(socket, ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);

  const gameServer = getGameServer();
  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.ProgressionGameStartingFloorSelected, floorNumber);
  gameServer.io.of("/").in(game.name).emit(ServerToClientEvent.DungeonFloorNumber, floorNumber);
}
