import {
  CharacterAndItems,
  CharacterAssociatedData,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { setAlert } from "../../components/alerts";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";

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
      try {
        character.convertOwnedItemsToShards(characterAndItems.itemIds);
      } catch (error) {
        if (error instanceof Error) {
          setAlert(error);
        }
      }
    }
  );

  getGameWorldView().modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantEquipmentModels,
    entityId: characterAndItems.characterId,
  });
}
