import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  CharacterAssociatedData,
  CombatAction,
  ERROR_MESSAGES,
  SpeedDungeonGame,
  getCombatActionProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterSelectedCombatActionHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterId: string,
  combatActionOption: null | CombatAction
) {
  characterAssociatedDataProvider(
    mutateGameState,
    mutateAlertState,
    characterId,
    ({ character, game, party }: CharacterAssociatedData, gameState: GameState) => {
      character.combatantProperties.selectedCombatAction = combatActionOption;
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);

      const combatActionPropertiesOption = combatActionOption
        ? getCombatActionProperties(party, combatActionOption, characterId)
        : null;
      if (combatActionPropertiesOption instanceof Error) return combatActionPropertiesOption;

      SpeedDungeonGame.assignCharacterActionTargets(
        game,
        characterId,
        gameState.username,
        combatActionPropertiesOption
      );
    }
  );
}
