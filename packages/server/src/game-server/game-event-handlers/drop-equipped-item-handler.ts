import {
  CharacterAssociatedData,
  CombatantProperties,
  EquipmentSlot,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";

export default function dropEquippedItemHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData,
  slot: EquipmentSlot
) {
  const { game, party, character } = characterAssociatedData;

  const itemDroppedIdResult = CombatantProperties.dropEquippedItem(
    party,
    character.combatantProperties,
    slot
  );
  if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

  party.itemsOnGroundNotYetReceivedByAllClients[itemDroppedIdResult] = [];

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.CharacterDroppedEquippedItem, {
    characterId: character.entityProperties.id,
    slot,
  });
}
