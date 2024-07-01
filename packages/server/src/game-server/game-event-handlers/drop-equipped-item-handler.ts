import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  EquipmentSlot,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export default function dropEquippedItemHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData,
  slot: EquipmentSlot
) {
  const { game, party, character } = characterAssociatedData;

  const itemOption = character.combatantProperties.equipment[slot];
  if (itemOption === undefined) return new Error(ERROR_MESSAGES.EQUIPMENT.NO_ITEM_EQUIPPED);
  delete character.combatantProperties.equipment[slot];
  const item = itemOption;

  party.currentRoom.items.push(item);
  party.itemsOnGroundNotYetReceivedByAllClients[item.entityProperties.id] = [];

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.CharacterDroppedEquippedItem, {
    characterId: character.entityProperties.id,
    slot,
  });
}
