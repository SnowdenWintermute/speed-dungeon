import {
  CharacterAssociatedData,
  ConsumableType,
  DungeonRoomType,
  ERROR_MESSAGES,
  EntityId,
  ItemType,
  ServerToClientEvent,
  getConsumableShardPrice,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { createConsumableByType } from "../item-generation/create-consumable-by-type.js";
import { getGameServer } from "../../singletons/index.js";

export function purchaseItemHandler(
  eventData: { characterId: EntityId; consumableType: ConsumableType },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;

  if (party.currentRoom.roomType !== DungeonRoomType.VendingMachine) {
    return new Error(ERROR_MESSAGES.PARTY.INCORRECT_ROOM_TYPE);
  }

  if (!character.combatantProperties.inventory.canPickUpItem(ItemType.Consumable)) {
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
  }

  const { characterId, consumableType } = eventData;

  if (consumableType === ConsumableType.StackOfShards) {
    return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
  }

  const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
  const priceOption = getConsumableShardPrice(floorNumber, consumableType);
  if (priceOption === null) return new Error(ERROR_MESSAGES.ITEM.NOT_PURCHASEABLE);
  const { inventory } = character.combatantProperties;
  if (priceOption > inventory.shards) return new Error(ERROR_MESSAGES.COMBATANT.NOT_ENOUGH_SHARDS);

  inventory.shards -= priceOption;
  const purchasedItem = createConsumableByType(consumableType);
  inventory.consumables.push(purchasedItem);

  getGameServer()
    .io.to(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterPurchasedItem, {
      characterId,
      item: purchasedItem,
      price: priceOption,
    });
}
