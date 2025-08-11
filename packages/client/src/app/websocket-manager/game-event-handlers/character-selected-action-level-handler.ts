import { GameState } from "@/stores/game-store";
import {
  CharacterAssociatedData,
  COMBAT_ACTIONS,
  CombatantContext,
  EntityId,
  ERROR_MESSAGES,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { synchronizeTargetingIndicators } from "./synchronize-targeting-indicators";

export function characterSelectedActionLevelHandler(eventData: {
  characterId: string;
  actionLevel: number;
}) {
  characterAssociatedDataProvider(
    eventData.characterId,
    ({ character, game, party }: CharacterAssociatedData, gameState: GameState) => {
      const { actionLevel } = eventData;
      character.combatantProperties.selectedActionLevel = actionLevel;
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      if (character.combatantProperties.controllingPlayer === null)
        return new Error(ERROR_MESSAGES.COMBATANT.EXPECTED_OWNER_ID_MISSING);

      if (character.combatantProperties.selectedCombatAction === null)
        return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

      const playerOption = game.players[character.combatantProperties.controllingPlayer];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

      const targetingCalculator = new TargetingCalculator(
        new CombatantContext(game, party, character),
        playerOption
      );
      const newTargetsResult =
        targetingCalculator.updateTargetingSchemeAfterSelectingActionLevel(actionLevel);

      const { selectedCombatAction: actionName } = character.combatantProperties;
      const action = COMBAT_ACTIONS[actionName];

      if (newTargetsResult instanceof Error) return newTargetsResult;
      if (newTargetsResult === undefined) return;

      let targetIds: null | EntityId[] = null;
      if (newTargetsResult) {
        const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
          action,
          newTargetsResult
        );
        if (targetIdsResult instanceof Error) return targetIdsResult;
        targetIds = targetIdsResult;
      }

      synchronizeTargetingIndicators(
        gameState,
        character.combatantProperties.selectedCombatAction,
        character.entityProperties.id,
        targetIds || []
      );
    }
  );
}
