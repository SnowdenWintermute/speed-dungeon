import {
  AdventuringParty,
  GameMessageType,
  ServerToClientEvent,
  SpeedDungeonGame,
  createPartyAbandonedMessage,
  createPartyWipeMessage,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { Socket } from "socket.io";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../singletons.js";
import errorHandler from "../error-handler.js";
import emitMessageInGameWithOptionalDelayForParty from "../utils/emit-message-in-game-with-optional-delay-for-party.js";
import GameModeContext from "../game-event-handlers/game-mode-strategies/game-mode-context.js";

export default function leavePartyHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  console.log("leave party handler called");
  const gameServer = getGameServer();
  const { game, player, partyOption, session } = playerAssociatedData;
  const gameModeContext = gameServer.gameModeContexts[game.mode];
  if (!partyOption) return;
  const { username } = player;

  const result = SpeedDungeonGame.removePlayerFromParty(game, username);
  if (result instanceof Error) return errorHandler(socket, result.message);
  let { partyWasRemoved } = result;

  // check if only dead players remain
  if (!partyWasRemoved && partyOption.playerUsernames.length > 0)
    partyWasRemoved = handleAbandoningDeadPartyMembers(game, partyOption, gameModeContext);

  const remainingParties = Object.values(game.adventuringParties);
  if (partyWasRemoved && remainingParties.length) {
    emitMessageInGameWithOptionalDelayForParty(
      game.name,
      GameMessageType.PartyWipe,
      createPartyWipeMessage(partyOption.name, partyOption.currentFloor, new Date())
    );
  }

  const partyChannelName = getPartyChannelName(game.name, partyOption.name);
  gameServer.removeSocketFromChannel(socket.id, partyChannelName);
  session.currentPartyName = null;

  socket.emit(ServerToClientEvent.PartyNameUpdate, null);
  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.PlayerChangedAdventuringParty, username, null);
}

function handleAbandoningDeadPartyMembers(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  gameModeContext: GameModeContext
) {
  let allRemainingCharactersAreDead = true;
  for (const character of Object.values(party.characters)) {
    if (character.combatantProperties.hitPoints > 0) {
      allRemainingCharactersAreDead = false;
      break;
    }
  }
  if (allRemainingCharactersAreDead) {
    for (const username of party.playerUsernames) {
      SpeedDungeonGame.removePlayerFromParty(game, username);
    }

    emitMessageInGameWithOptionalDelayForParty(
      game.name,
      GameMessageType.PartyDissolved,
      createPartyAbandonedMessage(party.name)
    );

    gameModeContext.onPartyWipe(game, party);
    return true;
  }

  return false;
}
