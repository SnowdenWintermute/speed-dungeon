import { CharacterAndSlot, CharacterAssociatedData } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";

export function characterUnequippedSlotHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    character.combatantProperties.equipment.unequipSlots([slot]);

    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantEquipmentModels,
      entityId: characterId,
    });
  });
}
