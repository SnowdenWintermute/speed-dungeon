import { GameState } from "@/stores/game-store";
import {
  CharacterAndItems,
  CharacterAssociatedData,
  Consumable,
  ConsumableType,
  Inventory,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export function characterPickedUpItemsHandler(characterAndItems: CharacterAndItems) {
  characterAssociatedDataProvider(
    characterAndItems.characterId,
    ({ party, character }: CharacterAssociatedData, gameState: GameState) => {
      for (const itemId of characterAndItems.itemIds) {
        const itemResult = Inventory.removeItem(party.currentRoom.inventory, itemId);
        if (itemResult instanceof Error) return itemResult;

        // handle shard stacks uniquely
        if (
          itemResult instanceof Consumable &&
          itemResult.consumableType === ConsumableType.StackOfShards
        ) {
          character.combatantProperties.inventory.shards += itemResult.usesRemaining;
          continue;
        }

        Inventory.insertItem(character.combatantProperties.inventory, itemResult);

        // otherwise it is possible that one player is hovering this item, then it "disappears"
        // from under their mouse cursor and they can never trigger a mouseleave event to unhover it
        if (itemResult.entityProperties.id === gameState.hoveredEntity?.entityProperties.id)
          gameState.hoveredEntity = null;
      }
    }
  );
}
