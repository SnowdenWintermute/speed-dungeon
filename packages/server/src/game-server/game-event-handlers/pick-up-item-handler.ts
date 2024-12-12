import {
  CharacterAndItems,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  INVENTORY_DEFAULT_CAPACITY,
  Item,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export default function pickUpItemHandler(
  eventData: CharacterAndItems,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  if (character.combatantProperties.inventory.items.length >= INVENTORY_DEFAULT_CAPACITY)
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
  const gameServer = getGameServer();
  let idsPickedUp: string[] = [];
  for (const itemId of eventData.itemIds) {
    // make sure all players know about the item or else desync will occur
    if (party.itemsOnGroundNotYetReceivedByAllClients[itemId] !== undefined)
      return new Error(ERROR_MESSAGES.ITEM.NOT_YET_AVAILABLE);
    const itemOption = Item.removeFromArray(party.currentRoom.items, itemId);
    if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
    character.combatantProperties.inventory.items.push(itemOption);
    idsPickedUp.push(itemOption.entityProperties.id);
  }

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterPickedUpItems, {
    characterId: character.entityProperties.id,
    itemIds: idsPickedUp,
  });
}
