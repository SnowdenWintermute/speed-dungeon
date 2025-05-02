import { GameState } from "@/stores/game-store";
import {
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  CombatantContext,
  ERROR_MESSAGES,
  NextOrPrevious,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { synchronizeTargetingIndicators } from "./synchronize-targeting-indicators";

export function characterCycledTargetsHandler(
  characterId: string,
  direction: NextOrPrevious,
  playerUsername: string
) {
  characterAssociatedDataProvider(
    characterId,
    ({ game, party, character }: CharacterAssociatedData, gameState: GameState) => {
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const playerOption = game.players[playerUsername];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
      const targetingCalculator = new TargetingCalculator(
        new CombatantContext(game, party, character),
        playerOption
      );
      const maybeError = targetingCalculator.cycleCharacterTargets(characterId, direction);
      if (maybeError instanceof Error) return maybeError;
      const { selectedCombatAction, combatActionTarget } = character.combatantProperties;
      if (selectedCombatAction === null)
        return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
      if (combatActionTarget === null)
        return new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);

      const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
        COMBAT_ACTIONS[selectedCombatAction],
        combatActionTarget
      );
      if (targetIdsResult instanceof Error) return targetIdsResult;

      synchronizeTargetingIndicators(
        gameState,
        character.combatantProperties.selectedCombatAction,
        character.entityProperties.id,
        targetIdsResult || []
      );
    }
  );
}
