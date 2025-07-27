import { GameState } from "@/stores/game-store";
import {
  CharacterAssociatedData,
  COMBAT_ACTIONS,
  CombatantContext,
  ERROR_MESSAGES,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { synchronizeTargetingIndicators } from "./synchronize-targeting-indicators";

export function characterCycledTargetingSchemesHandler(
  characterId: string,
  playerUsername: string
) {
  characterAssociatedDataProvider(
    characterId,
    ({ game, party, character }: CharacterAssociatedData, gameState: GameState) => {
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const playerOption = game.players[playerUsername];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
      const combatantContext = new CombatantContext(game, party, character);
      const targetingCalculator = new TargetingCalculator(combatantContext, playerOption);
      targetingCalculator.cycleCharacterTargetingSchemes(characterId);
      const actionNameOption = character.combatantProperties.selectedCombatAction;

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
        actionNameOption,
        character.entityProperties.id,
        targetIdsResult
      );
    }
  );
}
