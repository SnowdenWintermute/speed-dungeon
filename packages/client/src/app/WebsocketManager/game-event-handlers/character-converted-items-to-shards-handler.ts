import { GameState } from "@/stores/game-store";
import {
  CharacterAndItems,
  CharacterAssociatedData,
  CombatantEquipment,
  CombatantProperties,
  EntityId,
  convertItemsToShards,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { setAlert } from "../../components/alerts";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";

export function characterConvertedItemsToShardsHandler(characterAndItems: CharacterAndItems) {
  const itemIdsToUnequip: EntityId[] = [];

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
          itemIdsToUnequip.push(item.entityProperties.id);
          const slot = CombatantProperties.getSlotItemIsEquippedTo(
            combatantProperties,
            item.entityProperties.id
          );
          if (slot !== null) CombatantProperties.unequipSlots(combatantProperties, [slot]);
        }
      }
      const maybeError = convertItemsToShards(characterAndItems.itemIds, character);
      if (maybeError instanceof Error) setAlert(maybeError);
    }
  );

  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.ChangeEquipment,
    entityId: characterAndItems.characterId,
    unequippedIds: itemIdsToUnequip,
  });
}
