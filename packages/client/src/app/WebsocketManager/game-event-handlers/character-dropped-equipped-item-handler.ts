import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEvent,
  CombatantProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function characterDroppedEquippedItemHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemDroppedIdResult = CombatantProperties.dropEquippedItem(
      party,
      character.combatantProperties,
      slot
    );
    if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

    websocketConnection.emit(
      ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
      itemDroppedIdResult
    );
  });
}
