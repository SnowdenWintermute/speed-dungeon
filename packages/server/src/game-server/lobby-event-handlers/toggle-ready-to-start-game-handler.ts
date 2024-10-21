import { ERROR_MESSAGES, ServerToClientEvent, removeFromArray } from "@speed-dungeon/common";
import toggleReadyToExploreHandler from "../game-event-handlers/toggle-ready-to-explore-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../index.js";

export default function toggleReadyToStartGameHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const gameServer = getGameServer();
  const { game, session, player } = playerAssociatedData;
  const { username } = player;

  if (game.timeStarted) return new Error(ERROR_MESSAGES.LOBBY.GAME_ALREADY_STARTED);

  if (Object.keys(game.adventuringParties).length < 1)
    return new Error("A game must have at least one Adventuring Party before it can start");

  for (const party of Object.values(game.adventuringParties)) {
    if (party.characterPositions.length < 1)
      return new Error("Each party must have at least one character");
  }

  if (game.playersReadied.includes(username)) removeFromArray(game.playersReadied, username);
  else game.playersReadied.push(username);

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
