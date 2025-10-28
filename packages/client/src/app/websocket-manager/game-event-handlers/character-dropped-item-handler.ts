import {
  CharacterAndItem,
  CharacterAssociatedData,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { websocketConnection } from "@/singletons/websocket-connection";

export function characterDroppedItemHandler(characterAndItem: CharacterAndItem) {
  const { characterId, itemId } = characterAndItem;
  websocketConnection.emit(ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate, itemId);

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemResult = character.combatantProperties.inventory.removeItem(itemId);
    if (itemResult instanceof Error) return itemResult;
    const item = itemResult;
    party.currentRoom.inventory.insertItem(item);
  });
}
