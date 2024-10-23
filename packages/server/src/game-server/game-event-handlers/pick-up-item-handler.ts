import {
  CharacterAndItem,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  INVENTORY_DEFAULT_CAPACITY,
  Item,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../index.js";

export default function pickUpItemHandler(
  eventData: CharacterAndItem,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  if (character.combatantProperties.inventory.items.length >= INVENTORY_DEFAULT_CAPACITY)
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
  const gameServer = getGameServer();
  const { itemId } = eventData;

  // make sure all players know about the item or else desync will occur
  if (party.itemsOnGroundNotYetReceivedByAllClients[itemId] !== undefined)
    return new Error(ERROR_MESSAGES.ITEM.NOT_YET_AVAILABLE);

  const itemOption = Item.removeFromArray(party.currentRoom.items, itemId);
  if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);

  character.combatantProperties.inventory.items.push(itemOption);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterPickedUpItem, {
    characterId: character.entityProperties.id,
    itemId,
  });
}
