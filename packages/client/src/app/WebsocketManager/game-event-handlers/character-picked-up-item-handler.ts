import { GameState } from "@/stores/game-store";
import {
  CharacterAndItem,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  Item,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterPickedUpItemHandler(characterAndItem: CharacterAndItem) {
  characterAssociatedDataProvider(
    characterAndItem.characterId,
    ({ party, character }: CharacterAssociatedData, _gameState: GameState) => {
      const itemOption = Item.removeFromArray(party.currentRoom.items, characterAndItem.itemId);
      if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
      character.combatantProperties.inventory.items.push(itemOption);
    }
  );
}
