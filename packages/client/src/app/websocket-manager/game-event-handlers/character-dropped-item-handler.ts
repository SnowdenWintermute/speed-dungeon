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
    character.combatantProperties.inventory.dropItem(party, itemId);
  });
}
