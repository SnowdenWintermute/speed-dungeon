import {
  CharacterAndItem,
  CharacterAssociatedData,
  ClientToServerEvent,
  ClientToServerEventTypes,
  Inventory,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterDroppedItemHandler(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  characterAndItem: CharacterAndItem
) {
  const { characterId, itemId } = characterAndItem;
  socket.emit(ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate, itemId);

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemResult = Inventory.removeItem(character.combatantProperties.inventory, itemId);
    if (itemResult instanceof Error) return itemResult;
    const item = itemResult;
    party.currentRoom.items.push(item);
  });
}
