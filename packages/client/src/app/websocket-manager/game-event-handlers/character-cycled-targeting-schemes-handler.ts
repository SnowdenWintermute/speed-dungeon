import {
  ActionUserContext,
  CharacterAssociatedData,
  COMBAT_ACTIONS,
  ERROR_MESSAGES,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { AppStore } from "@/mobx-stores/app-store";

export function characterCycledTargetingSchemesHandler(
  characterId: string,
  playerUsername: string
) {
  characterAssociatedDataProvider(
    characterId,
    ({ game, party, character }: CharacterAssociatedData) => {
      const playerOption = game.players[playerUsername];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
      const combatantContext = new ActionUserContext(game, party, character);
      const targetingCalculator = new TargetingCalculator(combatantContext, playerOption);
      const targetingProperties = character.getTargetingProperties();
      targetingProperties.cycleTargetingSchemes(targetingCalculator);

      const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
      const combatActionTarget = targetingProperties.getSelectedTarget();

      if (selectedActionAndRank === null)
        return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
      if (combatActionTarget === null)
        return new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);

      const actionNameOption = selectedActionAndRank.actionName;
      const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
        COMBAT_ACTIONS[actionNameOption],
        combatActionTarget
      );
      if (targetIdsResult instanceof Error) return targetIdsResult;

      AppStore.get().targetIndicatorStore.synchronize(
        actionNameOption,
        character.getEntityId(),
        targetIdsResult
      );
    }
  );
}
