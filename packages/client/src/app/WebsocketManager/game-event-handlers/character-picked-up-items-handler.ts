import { GameState } from "@/stores/game-store";
import {
  CharacterAndItems,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  Inventory,
  Item,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterPickedUpItemsHandler(characterAndItems: CharacterAndItems) {
  characterAssociatedDataProvider(
    characterAndItems.characterId,
    ({ party, character }: CharacterAssociatedData, gameState: GameState) => {
      for (const itemId of characterAndItems.itemIds) {
        const itemOption = Item.removeFromArray(party.currentRoom.items, itemId);
        if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
        Inventory.insertItem(character.combatantProperties.inventory, itemOption);

        // otherwise it is possible that one player is hovering this item, then it "disappears"
        // from under their mouse cursor and they can never trigger a mouseleave event to unhover it
        if (itemOption.entityProperties.id === gameState.hoveredEntity?.entityProperties.id)
          gameState.hoveredEntity = null;
      }
    }
  );
}
