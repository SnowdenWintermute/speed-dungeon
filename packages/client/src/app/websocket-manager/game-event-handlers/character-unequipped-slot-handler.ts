import { CharacterAndSlot, CharacterAssociatedData } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";

export function characterUnequippedSlotHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    character.combatantProperties.equipment.unequipSlots([slot]);

    getGameWorldView().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantEquipmentModels,
      entityId: characterId,
    });
  });
}
