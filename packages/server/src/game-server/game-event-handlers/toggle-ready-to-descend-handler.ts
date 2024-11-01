import {
  AdventuringParty,
  DescendOrExplore,
  DungeonRoomType,
  ERROR_MESSAGES,
  GameMessageType,
  LEVEL_TO_REACH_FOR_ESCAPE,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import emitMessageInGameWithOptionalDelayForParty from "../utils/emit-message-in-game-with-optional-delay-for-party.js";

export default function toggleReadyToDescendHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const gameServer = getGameServer();
  const { player, game, partyOption } = playerAssociatedData;
  const gameModeContext = gameServer.gameModeContexts[game.mode];
  if (partyOption === undefined) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = partyOption;

  if (Object.values(party.currentRoom.monsters).length > 0)
    return new Error(ERROR_MESSAGES.PARTY.CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT);

  if (party.currentRoom.roomType !== DungeonRoomType.Staircase)
    return new Error(ERROR_MESSAGES.PARTY.NOT_AT_STAIRCASE);

  AdventuringParty.updatePlayerReadiness(party, player.username, DescendOrExplore.Descend);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io
    .in(partyChannelName)
    .emit(
      ServerToClientEvent.PlayerToggledReadyToDescendOrExplore,
      player.username,
      DescendOrExplore.Descend
    );

  let allPlayersReadyToDescend = true;
  for (const username of party.playerUsernames) {
    if (!party.playersReadyToDescend.includes(username)) {
      allPlayersReadyToDescend = false;
      break;
    }
  }

  if (!allPlayersReadyToDescend) return;

  party.currentFloor += 1;
  party.unexploredRooms = [];
  party.playersReadyToDescend = [];

  gameServer.io
    .in(partyChannelName)
    .emit(ServerToClientEvent.DungeonFloorNumber, party.currentFloor);
  // tell other parties so they feel the pressure of other parties descending
  emitMessageInGameWithOptionalDelayForParty(
    game.name,
    GameMessageType.PartyDescent,
    `Party "${party.name}" descended to floor ${party.currentFloor}`
  );

  // IF THEY HAVE ESCAPED
  if (party.currentFloor === LEVEL_TO_REACH_FOR_ESCAPE) {
    const timeOfEscape = Date.now();
    party.timeOfEscape = timeOfEscape;

    emitMessageInGameWithOptionalDelayForParty(
      game.name,
      GameMessageType.PartyEscape,
      `Party "${party.name}" escaped the dungeon at ${timeOfEscape.toLocaleString()}`
    );

    gameModeContext.onPartyEscape(game, party);
  }

  // generate next floor etc
  return gameServer.exploreNextRoom(game, party);
}
