import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  CharacterAndItem,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  Item,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterPickedUpItemHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterAndItem: CharacterAndItem
) {
  characterAssociatedDataProvider(
    mutateGameState,
    mutateAlertState,
    characterAndItem.characterId,
    ({ party, character }: CharacterAssociatedData, _gameState: GameState) => {
      const itemOption = Item.removeFromArray(party.currentRoom.items, characterAndItem.itemId);
      if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
      console.log("character picked up item", itemOption);
      character.combatantProperties.inventory.items.push(itemOption);
    }
  );
}
