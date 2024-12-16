import {
  CharacterAssociatedData,
  CombatantProperties,
  ServerToClientEvent,
  TaggedEquipmentSlot,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export default function unequipSlotHandler(
  eventProvidedData: {
    characterId: string;
    slot: TaggedEquipmentSlot;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  const { slot } = eventProvidedData;
  const gameServer = getGameServer();

  CombatantProperties.unequipSlots(character.combatantProperties, [slot]);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterUnequippedItem, {
    characterId: character.entityProperties.id,
    slot,
  });
}
