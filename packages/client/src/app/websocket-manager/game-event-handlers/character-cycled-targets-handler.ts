import { GameState } from "@/stores/game-store";
import {
  ActionUserContext,
  AdventuringParty,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
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
        new ActionUserContext(game, party, character),
        playerOption
      );

      const targetingProperties = character.getTargetingProperties();
      // @REFACTOR - just pass the targeting calculator for this pattern
      const idsByDisposition = character.getAllyAndOpponentIds(
        party,
        AdventuringParty.getBattleOption(party, game)
      );
      targetingProperties.cycleTargets(direction, playerOption, idsByDisposition);

      const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
      const combatActionTarget = targetingProperties.getSelectedTarget();

      if (selectedActionAndRank === null)
        return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
      if (combatActionTarget === null)
        return new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);

      const { actionName } = selectedActionAndRank;

      const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
        COMBAT_ACTIONS[actionName],
        combatActionTarget
      );
      if (targetIdsResult instanceof Error) return targetIdsResult;

      synchronizeTargetingIndicators(
        gameState,
        actionName,
        character.entityProperties.id,
        targetIdsResult || []
      );
    }
  );
}
