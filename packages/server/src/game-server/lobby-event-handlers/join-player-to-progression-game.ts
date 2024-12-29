import {
  ClientToServerEventTypes,
  Combatant,
  ERROR_MESSAGES,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  addCharacterToParty,
  getProgressionGameMaxStartingFloor,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import errorHandler from "../error-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import SocketIO from "socket.io";
import joinPlayerToGame from "./join-player-to-game.js";
import joinPartyHandler from "./join-party-handler.js";

export default async function joinPlayerToProgressionGame(
  gameServer: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  session: BrowserTabSession,
  game: SpeedDungeonGame,
  character: Combatant
) {
  const player = joinPlayerToGame(gameServer, game, session, socket);

  const partyName = getProgressionGamePartyName(game.name);
  joinPartyHandler(partyName, { game, partyOption: undefined, session, player }, socket);

  const playerOption = game.players[session.username];
  if (playerOption === undefined)
    return errorHandler(socket, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  addCharacterToParty(game, playerOption, character);

  game.lowestStartingFloorOptionsBySavedCharacter[character.entityProperties.id] =
    character.combatantProperties.deepestFloorReached;

  const maxStartingFloor = getProgressionGameMaxStartingFloor(
    game.lowestStartingFloorOptionsBySavedCharacter
  );
  console.log(
    "joined prog game, selectedStartingFloor:",
    game.selectedStartingFloor,
    "max:",
    maxStartingFloor
  );
  if (game.selectedStartingFloor > maxStartingFloor) {
    console.log("setting selected to max");
    game.selectedStartingFloor = maxStartingFloor;
  }

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.CharacterAddedToParty, partyName, session.username, character);
}
