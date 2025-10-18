import {
  CharacterAndItem,
  CharacterAssociatedData,
  ClientToServerEvent,
  Inventory,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { websocketConnection } from "@/singletons/websocket-connection";

export function characterDroppedItemHandler(characterAndItem: CharacterAndItem) {
  const { characterId, itemId } = characterAndItem;
  websocketConnection.emit(ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate, itemId);

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemResult = Inventory.removeItem(character.combatantProperties.inventory, itemId);
    if (itemResult instanceof Error) return itemResult;
    const item = itemResult;
    party.currentRoom.inventory.insertItem(item);
  });
}
