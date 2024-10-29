import {
  Combatant,
  ERROR_MESSAGES,
  GameMode,
  LOBBY_CHANNEL,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import writePlayerCharactersInGameToDb from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import leavePartyHandler from "./leave-party-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { Socket } from "socket.io";
import { getGameServer } from "../../index.js";
import { removeDeadCharactersFromLadder } from "../../kv-store/utils.js";
import { notifyOnlinePlayersOfTopRankedDeaths } from "../ladders/utils.js";
import { raceGameRecordsRepo } from "../../database/repos/race-game-records.js";

export default async function leaveGameHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const gameServer = getGameServer();
  const { game, partyOption, player, session } = playerAssociatedData;

  if (game.timeStarted && game.mode === GameMode.Race && game.isRanked) {
    if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    for (const character of Object.values(partyOption.characters)) {
      if (character.combatantProperties.controllingPlayer === player.username) {
        raceGameRecordsRepo.updatePlayerCharacterRecord(character);
      }
    }
  }

  if (player.partyName && game.mode === GameMode.Progression) {
    const maybeError = await writePlayerCharactersInGameToDb(game, player);
    if (maybeError instanceof Error) return errorHandler(socket, maybeError.message);

    // If they're leaving a game while dead, this character should be removed from the ladder
    const characters: { [combatantId: string]: Combatant } = {};
    for (const id of player.characterIds) {
      const characterResult = SpeedDungeonGame.getCharacter(game, player.partyName, id);
      if (characterResult instanceof Error) return characterResult;
      characters[characterResult.entityProperties.id] = characterResult;
    }
    const deathsAndRanks = await removeDeadCharactersFromLadder(characters);
    notifyOnlinePlayersOfTopRankedDeaths(deathsAndRanks, "");
  }

  leavePartyHandler(undefined, playerAssociatedData, socket);
  const partyWasRemoved = partyOption && !game.adventuringParties[partyOption.name];
  if (partyWasRemoved && Object.values(game.adventuringParties).length > 0) {
    // @TODO notify other players that a party has left
    // mark the race game as completed if in a ranked race game and set the only
    // remaining party as the winner
  }

  SpeedDungeonGame.removePlayer(game, session.username);
  const gameNameLeaving = game.name;
  session.currentGameName = null;

  if (Object.keys(game.players).length === 0) {
    if (game.timeStarted && game.mode === GameMode.Race && game.isRanked) {
      if (!game.gameRecordId) return new Error(ERROR_MESSAGES.GAME.MISSING_GAME_RECORD_ID);
      raceGameRecordsRepo.markGameAsCompleted(game.gameRecordId);
    }
    gameServer.games.remove(game.name);
  }

  gameServer.removeSocketFromChannel(socket.id, gameNameLeaving);
  gameServer.joinSocketToChannel(socket.id, LOBBY_CHANNEL);
  if (gameServer.games.get(gameNameLeaving)) {
    gameServer.io
      .of("/")
      .in(gameNameLeaving)
      .emit(ServerToClientEvent.PlayerLeftGame, session.username);
  }
  socket?.emit(ServerToClientEvent.GameFullUpdate, null);
}
