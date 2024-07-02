import {
  CharacterAssociatedData,
  CombatantProperties,
  EquipmentSlot,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export default function unequipSlotHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData,
  slot: EquipmentSlot
) {
  const { game, party, character } = characterAssociatedData;

  CombatantProperties.unequipSlots(character.combatantProperties, [slot]);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.CharacterUnequippedItem, {
    characterId: character.entityProperties.id,
    slot,
  });
}
