import {
  CharacterAndItems,
  CharacterAssociatedData,
  Consumable,
  ERROR_MESSAGES,
  Equipment,
  INVENTORY_DEFAULT_CAPACITY,
  Inventory,
  Item,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export function pickUpItemsHandler(
  eventData: CharacterAndItems,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  if (
    Inventory.getTotalNumberOfItems(character.combatantProperties.inventory) >=
    INVENTORY_DEFAULT_CAPACITY
  )
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);

  const gameServer = getGameServer();
  let idsPickedUp: string[] = [];

  for (const itemId of eventData.itemIds) {
    // make sure all players know about the item or else desync will occur
    if (party.itemsOnGroundNotYetReceivedByAllClients[itemId] !== undefined)
      return new Error(ERROR_MESSAGES.ITEM.NOT_YET_AVAILABLE);

    // handle shard stacks uniquely

    // let them pick up to capacity
    if (
      Inventory.getTotalNumberOfItems(character.combatantProperties.inventory) >=
      INVENTORY_DEFAULT_CAPACITY
    )
      break;

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
}
