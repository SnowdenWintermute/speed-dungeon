import {
  CharacterAssociatedData,
  CombatAttribute,
  CombatantProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { GameState } from "@/stores/game-store";

export default function characterIncrementedAttributePointHandler(
  characterId: string,
  attribute: CombatAttribute
) {
  characterAssociatedDataProvider(
    characterId,
    ({ character }: CharacterAssociatedData, _gameState: GameState) => {
      CombatantProperties.incrementAttributePoint(character.combatantProperties, attribute);
    }
  );
}
