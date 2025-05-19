import { GameState } from "@/stores/game-store";
import {
  CharacterAndItems,
  CharacterAssociatedData,
  CombatantEquipment,
  CombatantProperties,
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
    ({ character }: CharacterAssociatedData, _gameState: GameState) => {
      const { combatantProperties } = character;
      // unequip it if is equipped
      const equippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties, {
        includeUnselectedHotswapSlots: true,
      });

      for (const item of equippedItems) {
        if (characterAndItems.itemIds.includes(item.entityProperties.id)) {
          const slot = CombatantProperties.getSlotItemIsEquippedTo(
            combatantProperties,
            item.entityProperties.id
          );
          if (slot !== null) {
            CombatantProperties.unequipSlots(combatantProperties, [slot]);
            slotsUnequipped.push(slot);
          }
        }
      }
      const maybeError = convertItemsToShards(characterAndItems.itemIds, character);
      if (maybeError instanceof Error) setAlert(maybeError);
    }
  );

  for (const unequippedSlot of slotsUnequipped) {
    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.ChangeEquipment,
      entityId: characterAndItems.characterId,
      unequippedSlot,
    });
  }
}
