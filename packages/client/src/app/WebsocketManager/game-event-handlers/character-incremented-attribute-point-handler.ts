import {
  CharacterAssociatedData,
  CombatAttribute,
  CombatantProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";

export default function characterIncrementedAttributePointHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterId: string,
  attribute: CombatAttribute
) {
  characterAssociatedDataProvider(
    mutateGameState,
    mutateAlertState,
    characterId,
    ({ character }: CharacterAssociatedData, _gameState: GameState) => {
      CombatantProperties.incrementAttributePoint(character.combatantProperties, attribute);
    }
  );
}
