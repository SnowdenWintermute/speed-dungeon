import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  Item,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export default function pickUpItemHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData,
  itemId: string
) {
  const { game, party, character } = characterAssociatedData;

  // make sure all players know about the item or else desync will occur
  if (party.itemsOnGroundNotYetReceivedByAllClients[itemId] !== undefined)
    return new Error(ERROR_MESSAGES.ITEM.NOT_YET_AVAILABLE);

  const itemOption = Item.removeFromArray(party.currentRoom.items, itemId);
  if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);

  character.combatantProperties.inventory.items.push(itemOption);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.CharacterPickedUpItem, {
    characterId: character.entityProperties.id,
    itemId,
  });
}
