import {
  AdventuringParty,
  ERROR_MESSAGES,
  GameMessageType,
  GAME_CONFIG,
  ServerToClientEvent,
  getPartyChannelName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons/index.js";
import { ServerPlayerAssociatedData } from "../../event-middleware/index.js";
import { emitMessageInGameWithOptionalDelayForParty } from "../../utils/emit-message-in-game-with-optional-delay-for-party.js";
import { checkIfAllowedToDescend } from "./check-if-allowed-to-descend.js";
import { ExplorationAction } from "@speed-dungeon/common";

export function toggleReadyToDescendHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const { player, game, partyOption } = playerAssociatedData;
  if (partyOption === undefined) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = partyOption;

  const maybeForbidden = checkIfAllowedToDescend(party);
  if (maybeForbidden instanceof Error) return maybeForbidden;

  const { dungeonExplorationManager } = party;
  dungeonExplorationManager.updatePlayerExplorationActionChoice(
    player.username,
    ExplorationAction.Descend
  );

  getGameServer()
    .io.in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.PlayerToggledReadyToDescendOrExplore,
      player.username,
      ExplorationAction.Descend
    );

  const allPlayersReadyToDescend = dungeonExplorationManager.allPlayersReadyToTakeAction(
    ExplorationAction.Descend,
    party
  );
  if (!allPlayersReadyToDescend) return;

  return descendParty(game, party);
}

export async function descendParty(
  game: SpeedDungeonGame,
  party: AdventuringParty
): Promise<Error | void> {
  const gameServer = getGameServer();
  const gameModeContext = gameServer.gameModeContexts[game.mode];

  const { dungeonExplorationManager } = party;
  dungeonExplorationManager.incrementCurrentFloor();

  const floorNumber = dungeonExplorationManager.getCurrentFloor();

  dungeonExplorationManager.clearUnexploredRooms();
  dungeonExplorationManager.clearPlayerExplorationActionChoices();

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.DungeonFloorNumber, floorNumber);

  // tell other parties so they feel the pressure of other parties descending
  emitMessageInGameWithOptionalDelayForParty(
    game.name,
    GameMessageType.PartyDescent,
    `Party "${party.name}" descended to floor ${floorNumber}`
  );

  const partyEscapedTheDungeon = floorNumber === GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE;

  if (partyEscapedTheDungeon) {
    let anotherPartyAlreadyEscaped = false;
    for (const party of Object.values(game.adventuringParties)) {
      if (party.timeOfEscape) {
        anotherPartyAlreadyEscaped = true;
        break;
      }
    }

    const timeOfEscape = Date.now();
    party.timeOfEscape = timeOfEscape;

    let hasBeenMarkedAsWinnerMessageOption = "";
    if (!anotherPartyAlreadyEscaped)
      hasBeenMarkedAsWinnerMessageOption = " and has been marked as the winner";

    emitMessageInGameWithOptionalDelayForParty(
      game.name,
      GameMessageType.PartyEscape,
      `Party "${party.name}" escaped the dungeon at ${new Date(timeOfEscape).toLocaleString()}${hasBeenMarkedAsWinnerMessageOption}!`
    );

    const maybeError = await gameModeContext.onPartyEscape(game, party);
    if (maybeError instanceof Error) return maybeError;
  }

  // generate next floor etc
  return gameServer.exploreNextRoom(game, party);
}
