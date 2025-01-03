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

    // let them pick up to capacity
    if (
      Inventory.getTotalNumberOfItems(character.combatantProperties.inventory) >=
      INVENTORY_DEFAULT_CAPACITY
    )
      break;

    const itemOption = Item.removeFromArray(party.currentRoom.items, itemId);
    if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);

    if (itemOption instanceof Consumable)
      character.combatantProperties.inventory.consumables.push(itemOption);
    else if (itemOption instanceof Equipment)
      character.combatantProperties.inventory.equipment.push(itemOption);

    idsPickedUp.push(itemOption.entityProperties.id);
  }

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterPickedUpItems, {
    characterId: character.entityProperties.id,
    itemIds: idsPickedUp,
  });
}
