import {
  CharacterAssociatedData,
  ClientToServerEventTypes,
  CombatantProperties,
  ERROR_MESSAGES,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import writePlayerCharactersInGameToDb from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import errorHandler from "../error-handler.js";
import SocketIO from "socket.io";
import { getGameServer } from "../../index.js";

export default function dropItemHandler(
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: {
    itemId?: string; // since the preceding middleware only guarantees passing a type with a key 'characterId', this may
    // technically be undefined
    characterId: string;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  if (!eventData.itemId) throw new Error(ERROR_MESSAGES.SOCKET_EVENTS.MISSING_DATA);
  const { game, party, character, player } = characterAssociatedData;
  const gameServer = getGameServer();

  const itemDroppedIdResult = CombatantProperties.dropItem(
    party,
    character.combatantProperties,
    eventData.itemId
  );

  if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

  const playerOption = game.players[player.username];
  if (playerOption && playerOption.partyName && game.mode === GameMode.Progression) {
    writePlayerCharactersInGameToDb(game, playerOption).then((maybeError) => {
      if (maybeError instanceof Error) return errorHandler(socket, maybeError.message);
    });
  }

  party.itemsOnGroundNotYetReceivedByAllClients[itemDroppedIdResult] = [];

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterDroppedItem, {
    characterId: character.entityProperties.id,
    itemId: eventData.itemId,
  });
}
