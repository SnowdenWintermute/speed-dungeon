import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEvent,
  ClientToServerEventTypes,
  CombatantProperties,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterDroppedEquippedItemHandler(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  characterAndSlot: CharacterAndSlot
) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemDroppedIdResult = CombatantProperties.dropEquippedItem(
      party,
      character.combatantProperties,
      slot
    );
    if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

    socket.emit(ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate, itemDroppedIdResult);
  });
}
