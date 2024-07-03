import {
  CharacterAssociatedData,
  CombatantProperties,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export default function equipItemHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData,
  itemId: string,
  equipToAltSlot: boolean
) {
  const { game, party, character } = characterAssociatedData;

  console.log("attempting");
  const equipItemResult = CombatantProperties.equipItem(
    character.combatantProperties,
    itemId,
    equipToAltSlot
  );
  if (equipItemResult instanceof Error) return equipItemResult;

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.CharacterEquippedItem, {
    characterId: character.entityProperties.id,
    itemId,
    equipToAlternateSlot: equipToAltSlot,
  });
}
