import {
  CharacterAssociatedData,
  CombatantProperties,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../index.js";

export default function equipItemHandler(
  eventData: {
    characterId?: string;
    itemId?: string;
    equipToAltSlot?: boolean;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  const { itemId, equipToAltSlot } = eventData;
  if (itemId === undefined || equipToAltSlot === undefined)
    return new Error(ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_DATA);
  const gameServer = getGameServer();

  const equipItemResult = CombatantProperties.equipItem(
    character.combatantProperties,
    itemId,
    equipToAltSlot
  );
  if (equipItemResult instanceof Error) return equipItemResult;

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io.to(partyChannelName).emit(ServerToClientEvent.CharacterEquippedItem, {
    characterId: character.entityProperties.id,
    itemId,
    equipToAlternateSlot: equipToAltSlot,
  });
}
