import {
  CharacterAssociatedData,
  CombatantProperties,
  ConsumableType,
  DungeonRoomType,
  ERROR_MESSAGES,
  EntityId,
  Inventory,
  ItemType,
  ServerToClientEvent,
  getConsumableShardPrice,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { createConsumableByType } from "../item-generation/create-consumable-by-type.js";
import { getGameServer } from "../../singletons.js";

export function purchaseItemHandler(
  eventData: { characterId: EntityId; consumableType: ConsumableType },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;

  if (party.currentRoom.roomType !== DungeonRoomType.VendingMachine)
    return new Error(ERROR_MESSAGES.PARTY.INCORRECT_ROOM_TYPE);

  if (!CombatantProperties.canPickUpItem(character.combatantProperties, ItemType.Consumable))
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);

  const { characterId, consumableType } = eventData;

  if (consumableType === ConsumableType.StackOfShards)
    return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

  const price = getConsumableShardPrice(party.currentFloor, consumableType);
  const { inventory } = character.combatantProperties;
  if (price > inventory.shards) return new Error(ERROR_MESSAGES.COMBATANT.NOT_ENOUGH_SHARDS);

  inventory.shards -= price;
  const purchasedItem = createConsumableByType(consumableType);
  inventory.consumables.push(purchasedItem);

  getGameServer()
    .io.to(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterPurchasedItem, { characterId, item: purchasedItem, price });
}
