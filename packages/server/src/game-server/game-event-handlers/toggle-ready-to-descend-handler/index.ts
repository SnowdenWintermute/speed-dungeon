import {
  AdventuringParty,
  DescendOrExplore,
  ERROR_MESSAGES,
  GameMessageType,
  GAME_CONFIG,
  ServerToClientEvent,
  getPartyChannelName,
  SpeedDungeonPlayer,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";
import { ServerPlayerAssociatedData } from "../../event-middleware/index.js";
import emitMessageInGameWithOptionalDelayForParty from "../../utils/emit-message-in-game-with-optional-delay-for-party.js";
import { checkIfAllowedToDescend } from "./check-if-allowed-to-descend.js";

export function toggleReadyToDescendHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const { player, game, partyOption } = playerAssociatedData;
  if (partyOption === undefined) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = partyOption;

  const maybeForbidden = checkIfAllowedToDescend(party);
  if (maybeForbidden instanceof Error) return maybeForbidden;

  const allPlayersReadyToDescend = togglePlayerReadyToDescend(game, party, player);
  if (!allPlayersReadyToDescend) return;

  return descendParty(game, party);
}

/** Sets their readiness and alerts the client of update.
 * Returns if all players are now ready to descend */
export function togglePlayerReadyToDescend(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  player: SpeedDungeonPlayer
) {
  AdventuringParty.updatePlayerReadiness(party, player.username, DescendOrExplore.Descend);

  getGameServer()
    .io.in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.PlayerToggledReadyToDescendOrExplore,
      player.username,
      DescendOrExplore.Descend
    );

  for (const username of party.playerUsernames) {
    if (!party.playersReadyToDescend.includes(username)) return false;
  }
  return true;
}

export async function descendParty(
  game: SpeedDungeonGame,
  party: AdventuringParty
): Promise<Error | void> {
  const gameServer = getGameServer();
  const gameModeContext = gameServer.gameModeContexts[game.mode];

  party.currentFloor += 1;
  party.unexploredRooms = [];
  party.playersReadyToDescend = [];

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.DungeonFloorNumber, party.currentFloor);

  // tell other parties so they feel the pressure of other parties descending
  emitMessageInGameWithOptionalDelayForParty(
    game.name,
    GameMessageType.PartyDescent,
    `Party "${party.name}" descended to floor ${party.currentFloor}`
  );

  if (party.currentFloor === GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE) {
    const timeOfEscape = Date.now();
    party.timeOfEscape = timeOfEscape;

    emitMessageInGameWithOptionalDelayForParty(
      game.name,
      GameMessageType.PartyEscape,
      `Party "${party.name}" escaped the dungeon at ${timeOfEscape.toLocaleString()} and has been marked as the winner!`
    );

    const maybeError = await gameModeContext.onPartyEscape(game, party);
    if (maybeError instanceof Error) return maybeError;
  }

  // generate next floor etc
  return gameServer.exploreNextRoom(game, party);
}
