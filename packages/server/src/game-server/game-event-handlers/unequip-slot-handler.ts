import {
  CharacterAssociatedData,
  CombatantProperties,
  ERROR_MESSAGES,
  EquipmentSlot,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../index.js";

export default function unequipSlotHandler(
  eventProvidedData: {
    characterId?: string;
    slot?: EquipmentSlot;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  if (!eventProvidedData.slot) throw new Error(ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_DATA);
  const { slot } = eventProvidedData;
  const gameServer = getGameServer();

  CombatantProperties.unequipSlots(character.combatantProperties, [slot]);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterUnequippedItem, {
    characterId: character.entityProperties.id,
    slot,
  });
}
