import {
  GameMessage,
  GameMessageType,
  ServerToClientEvent,
  SpeedDungeonGame,
  createPartyAbandonedMessage,
  createPartyWipeMessage,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { Socket } from "socket.io";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../index.js";
import errorHandler from "../error-handler.js";

export default function leavePartyHandler(
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
  let { partyNameLeft, partyWasRemoved } = result;

  // check if only dead players remain
  if (!partyWasRemoved && partyOption.playerUsernames.length > 0) {
    let allRemainingCharactersAreDead = true;
    for (const character of Object.values(partyOption.characters)) {
      if (character.combatantProperties.hitPoints > 0) {
        allRemainingCharactersAreDead = false;
        break;
      }
    }
    if (allRemainingCharactersAreDead) {
      for (const username of partyOption.playerUsernames) {
        SpeedDungeonGame.removePlayerFromParty(game, username);
      }

      gameServer.io
        .in(getPartyChannelName(game.name, partyOption.name))
        .emit(
          ServerToClientEvent.GameMessage,
          new GameMessage(
            GameMessageType.PartyDissolved,
            false,
            createPartyAbandonedMessage(partyOption.name)
          )
        );

      partyWasRemoved = true;
      gameModeContext.onPartyWipe(game, partyOption);
    }
  }

  const remainingParties = Object.values(game.adventuringParties);
  if (partyWasRemoved && remainingParties.length) {
    gameServer.io
      .in(game.name)
      .emit(
        ServerToClientEvent.GameMessage,
        new GameMessage(
          GameMessageType.PartyWipe,
          true,
          createPartyWipeMessage(partyOption.name, partyOption.currentFloor, new Date())
        )
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
