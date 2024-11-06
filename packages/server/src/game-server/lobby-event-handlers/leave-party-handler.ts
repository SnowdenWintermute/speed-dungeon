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

export default async function leavePartyHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const gameServer = getGameServer();
  const { game, player, partyOption, session } = playerAssociatedData;
  const gameModeContext = gameServer.gameModeContexts[game.mode];
  if (!partyOption) return;
  const { username } = player;

  const result = SpeedDungeonGame.removePlayerFromParty(game, username);
  if (result instanceof Error) return errorHandler(socket, result.message);
  let { partyWasRemoved } = result;
  let deadPartyMembersAbandoned = false;

  // check if only dead players remain
  if (!partyWasRemoved && partyOption.playerUsernames.length > 0)
    deadPartyMembersAbandoned = handleAbandoningDeadPartyMembers(game, partyOption);

  if (
    partyWasRemoved ||
    (deadPartyMembersAbandoned && typeof partyOption.timeOfWipe !== "number")
  ) {
    partyOption.timeOfWipe = Date.now();
    const maybeError = await gameModeContext.onPartyWipe(game, partyOption);
    if (maybeError instanceof Error) return errorHandler(socket, maybeError.message);

    const remainingParties = Object.values(game.adventuringParties);
    if (remainingParties.length) {
      emitMessageInGameWithOptionalDelayForParty(
        game.name,
        GameMessageType.PartyWipe,
        createPartyWipeMessage(partyOption.name, partyOption.currentFloor, new Date(Date.now()))
      );
    }
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

function handleAbandoningDeadPartyMembers(game: SpeedDungeonGame, party: AdventuringParty) {
  let allRemainingCharactersAreDead = true;
  for (const character of Object.values(party.characters)) {
    if (character.combatantProperties.hitPoints > 0) {
      allRemainingCharactersAreDead = false;
      break;
    }
  }

  if (allRemainingCharactersAreDead) {
    emitMessageInGameWithOptionalDelayForParty(
      game.name,
      GameMessageType.PartyDissolved,
      createPartyAbandonedMessage(party.name)
    );

    return true;
  }

  return false;
}
