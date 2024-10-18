import { ERROR_MESSAGES, GameMode, ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from "..";
import errorHandler from "../error-handler.js";

const ATTEMPT_TEXT = "A client tried to select a saved character but";

export default async function selectProgressionGameStartingFloorHandler(
  this: GameServer,
  socketId: string,
  floorNumber: number
) {
  const [socket, socketMeta] = this.getConnection(socketId);
  const { currentGameName } = socketMeta;

  if (!currentGameName) {
    console.log(`${ATTEMPT_TEXT} they have no game`);
    return errorHandler(socket, `${ATTEMPT_TEXT} they have no game`);
  }
  const game = this.games.get(currentGameName);
  if (!game) return errorHandler(socket, `${ATTEMPT_TEXT} their game was not found`);
  if (game.mode !== GameMode.Progression) return errorHandler(socket, ERROR_MESSAGES.GAME.MODE);
  if (game.selectedStartingFloor.max < floorNumber)
    return errorHandler(socket, ERROR_MESSAGES.GAME.STARTING_FLOOR_LIMIT);
  game.selectedStartingFloor.current = floorNumber;
  for (const party of Object.values(game.adventuringParties)) {
    party.currentFloor = game.selectedStartingFloor.current;
  }

  const player = game.players[socketMeta.username];
  if (!player) return errorHandler(socket, `${ATTEMPT_TEXT} their player wasn't in the game`);
  if (!player.partyName) return errorHandler(socket, ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);

  this.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.ProgressionGameStartingFloorSelected, floorNumber);
  this.io.of("/").in(game.name).emit(ServerToClientEvent.DungeonFloorNumber, floorNumber);
}
