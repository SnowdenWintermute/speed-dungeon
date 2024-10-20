import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEventTypes,
  CombatantProperties,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import writePlayerCharactersInGameToDb from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import errorHandler from "../error-handler.js";
import SocketIO from "socket.io";
import { getGameServer } from "../../index.js";

export default function dropEquippedItemHandler(
  eventProvidedData: CharacterAndSlot,
  characterAssociatedData: CharacterAssociatedData,
  socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { game, party, character, player } = characterAssociatedData;

  const gameServer = getGameServer();

  const itemDroppedIdResult = CombatantProperties.dropEquippedItem(
    party,
    character.combatantProperties,
    eventProvidedData.slot
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
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterDroppedEquippedItem, {
    characterId: character.entityProperties.id,
    slot: eventProvidedData.slot,
  });
}
