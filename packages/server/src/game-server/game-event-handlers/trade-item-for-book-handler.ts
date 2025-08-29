import SocketIO from "socket.io";
import {
  BookConsumableType,
  CharacterAndItems,
  CharacterAssociatedData,
  ClientToServerEventTypes,
  CombatantEquipment,
  CombatantProperties,
  ConsumableType,
  ERROR_MESSAGES,
  EntityId,
  GameMode,
  Inventory,
  ServerToClientEvent,
  ServerToClientEventTypes,
  applyEquipmentEffectWhileMaintainingResourcePercentages,
  combatantIsAllowedToConvertItemsToShards,
  combatantIsAllowedToTradeForBooks,
  convertItemsToShards,
  getBookLevelForTrade,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import writePlayerCharactersInGameToDb from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import cloneDeep from "lodash.clonedeep";
import { createConsumableByType } from "../item-generation/create-consumable-by-type.js";

export async function tradeItemForBookHandler(
  eventData: { characterId: EntityId; itemId: EntityId; bookType: BookConsumableType },
  characterAssociatedData: CharacterAssociatedData,
  _socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { game, party, character, player } = characterAssociatedData;
  const gameServer = getGameServer();
  const { characterId, itemId, bookType } = eventData;

  const { combatantProperties } = character;
  if (!combatantIsAllowedToTradeForBooks(combatantProperties, party.currentRoom.roomType))
    return new Error(ERROR_MESSAGES.NOT_PERMITTED);

  const inventoryFull = Inventory.isAtCapacity(combatantProperties);
  if (inventoryFull) return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);

  // find and convert it if owned (common code)
  // clone the itemIds so we can keep the unmodified original to send to the clients
  const bookResult = tradeItemForBook(
    itemId,
    character.combatantProperties,
    bookType,
    party.currentFloor
  );
  if (bookResult instanceof Error) return bookResult;

  Inventory.insertItem(combatantProperties.inventory, bookResult);

  // SERVER
  // save the character if in progression game
  if (game.mode === GameMode.Progression) {
    const writeResult = await writePlayerCharactersInGameToDb(game, player);
    if (writeResult instanceof Error) return writeResult;
  }

  // emit the message on this party's channel
  gameServer.io
    .to(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterTradedItemForBook, {
      characterId,
      itemIdTraded: itemId,
      book: bookResult,
    });
}

function tradeItemForBook(
  itemToTradeId: EntityId,
  combatantProperties: CombatantProperties,
  bookType: BookConsumableType,
  vendingMachineLevel: number
) {
  const removedItemResult = CombatantProperties.removeOwnedItem(combatantProperties, itemToTradeId);
  if (removedItemResult instanceof Error) return removedItemResult;

  const bookToReturn = createConsumableByType(bookType);
  bookToReturn.itemLevel = getBookLevelForTrade(removedItemResult.itemLevel, vendingMachineLevel);

  return bookToReturn;
}
