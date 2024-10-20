import {
  CharacterAssociatedData,
  ClientToServerEventTypes,
  CombatantProperties,
  ERROR_MESSAGES,
  EquipmentSlot,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../index.js";
import SocketIO from "socket.io";

export default function unequipSlotHandler(
  _socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
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
