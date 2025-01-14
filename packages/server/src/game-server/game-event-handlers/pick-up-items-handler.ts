import {
  CharacterAndItems,
  CharacterAssociatedData,
  CombatantProperties,
  Consumable,
  ConsumableType,
  ERROR_MESSAGES,
  Equipment,
  Inventory,
  ItemType,
  ServerToClientEvent,
  getPartyChannelName,
  pickUpShardStack,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export function pickUpItemsHandler(
  eventData: CharacterAndItems,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;

  let reachedMaxCapacity = false;

  const gameServer = getGameServer();
  let idsPickedUp: string[] = [];

  for (const itemId of eventData.itemIds) {
    // make sure all players know about the item or else desync will occur
    if (party.itemsOnGroundNotYetReceivedByAllClients[itemId] !== undefined)
      return new Error(ERROR_MESSAGES.ITEM.NOT_YET_AVAILABLE);

    // handle shard stacks uniquely
    const itemInInventoryResult = Inventory.getItemById(party.currentRoom.inventory, itemId);
    if (itemInInventoryResult instanceof Error) return itemInInventoryResult;
    if (
      itemInInventoryResult instanceof Consumable &&
      itemInInventoryResult.consumableType === ConsumableType.StackOfShards
    ) {
      const mabyeError = pickUpShardStack(
        itemId,
        party.currentRoom.inventory,
        character.combatantProperties.inventory
      );
      if (mabyeError instanceof Error) return mabyeError;
      idsPickedUp.push(itemInInventoryResult.entityProperties.id);
      continue;
    }

    // let them pick up to capacity
    const itemType =
      itemInInventoryResult instanceof Consumable ? ItemType.Consumable : ItemType.Equipment;
    if (!CombatantProperties.canPickUpItem(character.combatantProperties, itemType)) {
      reachedMaxCapacity = true;
      continue;
    } // continue instead of break so they can still pick up shard stacks

    const itemResult = Inventory.removeItem(party.currentRoom.inventory, itemId);
    if (itemResult instanceof Error) return itemResult;

    if (itemResult instanceof Consumable)
      character.combatantProperties.inventory.consumables.push(itemResult);
    else if (itemResult instanceof Equipment)
      character.combatantProperties.inventory.equipment.push(itemResult);

    idsPickedUp.push(itemResult.entityProperties.id);
  }

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterPickedUpItems, {
    characterId: character.entityProperties.id,
    itemIds: idsPickedUp,
  });

  if (reachedMaxCapacity) return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
}
