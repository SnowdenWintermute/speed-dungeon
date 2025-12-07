import {
  ActionUserContext,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  NextOrPrevious,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { AppStore } from "@/mobx-stores/app-store";

export function characterCycledTargetsHandler(
  characterId: string,
  direction: NextOrPrevious,
  playerUsername: string
) {
  characterAssociatedDataProvider(
    characterId,
    ({ game, party, character }: CharacterAssociatedData) => {
      const playerOption = game.players[playerUsername];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

      // @REFACTOR - just pass the targeting calculator for this pattern
      const targetingCalculator = new TargetingCalculator(
        new ActionUserContext(game, party, character),
        playerOption
      );

      const validTargetsByDisposition = targetingCalculator.getValidTargetsByDisposition();
      const targetingProperties = character.getTargetingProperties();
      targetingProperties.cycleTargets(direction, playerOption, validTargetsByDisposition);

      const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
      const combatActionTarget = targetingProperties.getSelectedTarget();

      if (selectedActionAndRank === null) {
        console.log("characterCycledTargetsHandler");
        return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
      }
      if (combatActionTarget === null) {
        return new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);
      }

      const { actionName } = selectedActionAndRank;

      const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
        COMBAT_ACTIONS[actionName],
        combatActionTarget
      );
      if (targetIdsResult instanceof Error) return targetIdsResult;

      AppStore.get().targetIndicatorStore.synchronize(
        actionName,
        character.getEntityId(),
        targetIdsResult || []
      );
    }
  );
}
