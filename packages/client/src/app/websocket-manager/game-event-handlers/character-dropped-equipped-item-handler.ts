import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { websocketConnection } from "@/singletons/websocket-connection";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";

export function characterDroppedEquippedItemHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemDroppedIdResult = character.combatantProperties.inventory.dropEquippedItem(
      party,
      slot
    );
    if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

    websocketConnection.emit(
      ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
      itemDroppedIdResult
    );

    getGameWorldView().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantEquipmentModels,
      entityId: characterId,
    });
  });
}
