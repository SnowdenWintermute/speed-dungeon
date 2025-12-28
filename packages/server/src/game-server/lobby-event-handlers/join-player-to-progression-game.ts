import {
  ClientToServerEventTypes,
  Combatant,
  ERROR_MESSAGES,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import errorHandler from "../error-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import SocketIO from "socket.io";
import joinPlayerToGame from "./join-player-to-game.js";
import { joinPartyHandler } from "./join-party-handler.js";

export async function joinPlayerToProgressionGame(
  gameServer: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  session: BrowserTabSession,
  game: SpeedDungeonGame,
  character: { combatant: Combatant; pets: Combatant[] }
) {
  const player = joinPlayerToGame(gameServer, game, session, socket);

  const partyName = getProgressionGamePartyName(game.name);
  joinPartyHandler(partyName, { game, partyOption: undefined, session, player }, socket);

  const partyOption = game.adventuringParties[partyName];
  if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  const playerOption = game.players[session.username];
  if (playerOption === undefined)
    return errorHandler(socket, new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));

  game.addCharacterToParty(partyOption, playerOption, character.combatant, character.pets);

  game.lowestStartingFloorOptionsBySavedCharacter[character.combatant.entityProperties.id] =
    character.combatant.combatantProperties.deepestFloorReached;

  const maxStartingFloor = game.getMaxStartingFloor();

  if (game.selectedStartingFloor > maxStartingFloor) {
    game.selectedStartingFloor = maxStartingFloor;
  }

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(
      ServerToClientEvent.CharacterAddedToParty,
      session.username,
      character.combatant.getSerialized(),
      character.pets.map((pet) => pet.getSerialized())
    );
}
