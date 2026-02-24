import SocketIO from "socket.io";
import {
  CharacterAndItems,
  CharacterAssociatedData,
  ClientToServerEventTypes,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { writePlayerCharactersInGameToDb } from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import cloneDeep from "lodash.clonedeep";

export async function convertItemsToShardsHandler(
  characterAndItems: CharacterAndItems,
  characterAssociatedData: CharacterAssociatedData,
  _socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { game, party, character, player } = characterAssociatedData;
  const gameServer = getGameServer();
  const { itemIds } = characterAndItems;

  character.combatantProperties.abilityProperties.requireShardConversionPermitted(
    party.currentRoom.roomType
  );

  // find and convert it if owned (common code)
  // clone the itemIds so we can keep the unmodified original to send to the clients
  character.convertOwnedItemsToShards(cloneDeep(itemIds));

  // SERVER
  // save the character if in progression game
  if (game.mode === GameMode.Progression) {
    const writeResult = await writePlayerCharactersInGameToDb(game, player);
    if (writeResult instanceof Error) return writeResult;
  }
  // emit the message on this party's channel
  gameServer.io
    .to(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterConvertedItemsToShards, characterAndItems);
}
