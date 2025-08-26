import {
  CharacterAssociatedData,
  CombatantProperties,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";

export default function equipItemHandler(
  eventData: {
    characterId: string;
    itemId: string;
    equipToAltSlot: boolean;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  const { itemId, equipToAltSlot } = eventData;
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
