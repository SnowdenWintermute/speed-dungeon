import { GameState } from "@/stores/game-store";
import {
  CharacterAndItems,
  CharacterAssociatedData,
  convertItemsToShards,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { setAlert } from "../../components/alerts";

export function characterConvertedItemsToShardsHandler(characterAndItems: CharacterAndItems) {
  characterAssociatedDataProvider(
    characterAndItems.characterId,
    ({ character }: CharacterAssociatedData, _gameState: GameState) => {
      const maybeError = convertItemsToShards(characterAndItems.itemIds, character);
      if (maybeError instanceof Error) setAlert(maybeError);
    }
  );
}
