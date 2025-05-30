import {
  CharacterAndItem,
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
import { getGameServer } from "../../singletons.js";

export default async function dropItemHandler(
  eventData: CharacterAndItem,
  characterAssociatedData: CharacterAssociatedData,
  socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
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
    const maybeError = await writePlayerCharactersInGameToDb(game, playerOption);
    if (maybeError instanceof Error) return errorHandler(socket, maybeError);
  }

  party.itemsOnGroundNotYetReceivedByAllClients[itemDroppedIdResult] = [];

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterDroppedItem, {
    characterId: character.entityProperties.id,
    itemId: eventData.itemId,
  });
}
