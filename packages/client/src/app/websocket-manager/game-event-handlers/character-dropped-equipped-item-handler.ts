import { CharacterAndSlot, CharacterAssociatedData, ClientIntentType } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import { gameClientSingleton } from "@/singletons/lobby-client";

export function characterDroppedEquippedItemHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemDroppedIdResult = character.combatantProperties.inventory.dropEquippedItem(
      party,
      slot
    );
    if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

    gameClientSingleton.get().dispatchIntent({
      type: ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate,
      data: {
        itemId: itemDroppedIdResult,
      },
    });

    getGameWorldView().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantEquipmentModels,
      entityId: characterId,
    });
  });
}
