import {
  CharacterAssociatedData,
  ServerToClientEvent,
  TaggedEquipmentSlot,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";

export function unequipSlotHandler(
  eventProvidedData: {
    characterId: string;
    slot: TaggedEquipmentSlot;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  const { slot } = eventProvidedData;
  const gameServer = getGameServer();

  character.combatantProperties.equipment.unequipSlots([slot]);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterUnequippedItem, {
    characterId: character.entityProperties.id,
    slot,
  });
}
