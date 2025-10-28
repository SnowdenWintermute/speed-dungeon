import {
  CharacterAndItems,
  CharacterAssociatedData,
  TaggedEquipmentSlot,
  convertItemsToShards,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { setAlert } from "../../components/alerts";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";

export function characterConvertedItemsToShardsHandler(characterAndItems: CharacterAndItems) {
  const slotsUnequipped: TaggedEquipmentSlot[] = [];

  characterAssociatedDataProvider(
    characterAndItems.characterId,
    ({ character }: CharacterAssociatedData) => {
      const { combatantProperties } = character;
      // unequip it if is equipped
      const equippedItems = combatantProperties.equipment.getAllEquippedItems({
        includeUnselectedHotswapSlots: true,
      });

      for (const item of equippedItems) {
        if (characterAndItems.itemIds.includes(item.entityProperties.id)) {
          const slot = combatantProperties.equipment.getSlotItemIsEquippedTo(
            item.entityProperties.id
          );
          if (slot !== null) {
            combatantProperties.equipment.unequipSlots([slot]);
            slotsUnequipped.push(slot);
          }
        }
      }
      const maybeError = convertItemsToShards(characterAndItems.itemIds, character);
      if (maybeError instanceof Error) setAlert(maybeError);
    }
  );

  getGameWorld().modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantEquipmentModels,
    entityId: characterAndItems.characterId,
  });
}
