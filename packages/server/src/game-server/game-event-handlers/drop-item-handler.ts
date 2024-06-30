import {
  CharacterAssociatedData,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { Inventory } from "@speed-dungeon/common";

export default function dropItemHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData,
  itemId: string
) {
  const { game, party, character } = characterAssociatedData;
  const itemResult = Inventory.removeItem(character.combatantProperties.inventory, itemId);
  if (itemResult instanceof Error) return itemResult;
  const item = itemResult;

  party.currentRoom.items.push(item);

  party.itemsOnGroundNotYetReceivedByAllClients[item.entityProperties.id] = [];

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.CharacterDroppedItem, {
    characterId: character.entityProperties.id,
    itemId,
  });
}
