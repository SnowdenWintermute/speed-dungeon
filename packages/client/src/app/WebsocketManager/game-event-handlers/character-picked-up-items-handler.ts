import { GameState } from "@/stores/game-store";
import {
  CharacterAndItems,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  Item,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterPickedUpItemsHandler(characterAndItems: CharacterAndItems) {
  characterAssociatedDataProvider(
    characterAndItems.characterId,
    ({ party, character }: CharacterAssociatedData, _gameState: GameState) => {
      for (const itemId of characterAndItems.itemIds) {
        const itemOption = Item.removeFromArray(party.currentRoom.items, itemId);
        if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
        character.combatantProperties.inventory.items.push(itemOption);
      }
    }
  );
}
