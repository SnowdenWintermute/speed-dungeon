import {
  Combatant,
  ERROR_MESSAGES,
  GameMode,
  LOBBY_CHANNEL,
  ServerToClientEvent,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import writePlayerCharactersInGameToDb from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import leavePartyHandler from "./leave-party-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { Socket } from "socket.io";
import { getGameServer } from "../../index.js";
import { removeDeadCharactersFromLadder } from "../../kv-store/utils.js";
import { notifyOnlinePlayersOfTopRankedDeaths } from "../ladders/utils.js";

export default async function leaveGameHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const gameServer = getGameServer();
  const { game, player, session } = playerAssociatedData;

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
    notifyOnlinePlayersOfTopRankedDeaths(deathsAndRanks);
  }

  leavePartyHandler(undefined, playerAssociatedData, socket);

  SpeedDungeonGame.removePlayer(game, session.username);
  const gameNameLeaving = game.name;
  session.currentGameName = null;
  if (Object.keys(game.players).length === 0) gameServer.games.remove(game.name);
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
