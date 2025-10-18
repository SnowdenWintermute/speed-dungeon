import {
  ArrayUtils,
  ERROR_MESSAGES,
  GAME_CONFIG,
  GameMode,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { toggleReadyToExploreHandler } from "../game-event-handlers/toggle-ready-to-explore-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../singletons/index.js";

export async function toggleReadyToStartGameHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const gameServer = getGameServer();
  const { game, session, player } = playerAssociatedData;

  const { username } = player;
  if (game.timeStarted) return new Error(ERROR_MESSAGES.LOBBY.GAME_ALREADY_STARTED);

  const minimumNumberOfParties =
    game.mode === GameMode.Race && game.isRanked ? GAME_CONFIG.MIN_RACE_GAME_PARTIES : 1;

  if (Object.keys(game.adventuringParties).length < minimumNumberOfParties)
    return new Error(
      `Game does not have the minimum number of parties (${minimumNumberOfParties})`
    );

  if (!player.characterIds.length) return new Error("You must control at least one character");

  for (const party of Object.values(game.adventuringParties)) {
    if (!party.combatantManager.hasCharacters())
      return new Error("Each party must have at least one character");
    party.dungeonExplorationManager.setCurrentFloor(game.selectedStartingFloor);
  }

  game.togglePlayerReadyToStartGameStatus(username);

  let allPlayersReadied = true;

  for (const usernameInGame of Object.keys(game.players)) {
    if (game.playersReadied.includes(usernameInGame)) continue;
    else {
      allPlayersReadied = false;
      break;
    }
  }

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.PlayerToggledReadyToStartGame, username);

  if (!allPlayersReadied) return;

  game.timeStarted = Date.now();

  const gameModeContext = gameServer.gameModeContexts[game.mode];
  await gameModeContext.onGameStart(game);

  gameServer.io.of("/").in(game.name).emit(ServerToClientEvent.GameStarted, game.timeStarted);

  for (const player of Object.values(game.players)) {
    const socketIdResult = gameServer.getSocketIdOfPlayer(game, player.username);
    if (socketIdResult instanceof Error) return socketIdResult;
    if (!player.partyName) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
    const partyOption = game.adventuringParties[player.partyName];
    if (!partyOption) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

    toggleReadyToExploreHandler(undefined, { game, partyOption, player, session });
  }
}
