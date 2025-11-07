import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { websocketConnection } from "@/singletons/websocket-connection";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";

export function characterDroppedEquippedItemHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemDroppedIdResult = character.combatantProperties.inventory.dropEquippedItem(
      party,
      slot
    );
    if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

    AppStore.get().actionMenuStore.getCurrentMenu().recalculateButtons();

    websocketConnection.emit(
      ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
      itemDroppedIdResult
    );

    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantEquipmentModels,
      entityId: characterId,
    });
  });
}
