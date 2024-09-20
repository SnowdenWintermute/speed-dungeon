import {
  CharacterAssociatedData,
  CombatantProperties,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";

export default function dropItemHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData,
  itemId: string
) {
  const { game, party, character } = characterAssociatedData;

  const itemDroppedIdResult = CombatantProperties.dropItem(
    party,
    character.combatantProperties,
    itemId
  );
  if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;
  party.itemsOnGroundNotYetReceivedByAllClients[itemDroppedIdResult] = [];

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.CharacterDroppedItem, {
    characterId: character.entityProperties.id,
    itemId,
  });
}
