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

export async function joinPlayerToProgressionGame(
  gameServer: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  session: BrowserTabSession,
  game: SpeedDungeonGame,
  character: Combatant
) {
  const player = joinPlayerToGame(gameServer, game, session, socket);

  const partyName = getProgressionGamePartyName(game.name);
  joinPartyHandler(partyName, { game, partyOption: undefined, session, player }, socket);

  const partyOption = game.adventuringParties[partyName];
  if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  const playerOption = game.players[session.username];
  if (playerOption === undefined)
    return errorHandler(socket, new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));

  const deserialized = Combatant.getDeserialized(character);

  // @TODO - actually load their pets
  const pets: Combatant[] = [];

  addCharacterToParty(game, partyOption, playerOption, deserialized, pets);

  game.lowestStartingFloorOptionsBySavedCharacter[character.entityProperties.id] =
    character.combatantProperties.deepestFloorReached;

  const maxStartingFloor = getProgressionGameMaxStartingFloor(
    game.lowestStartingFloorOptionsBySavedCharacter
  );

  if (game.selectedStartingFloor > maxStartingFloor) game.selectedStartingFloor = maxStartingFloor;

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.CharacterAddedToParty, partyName, session.username, character, pets);
}
