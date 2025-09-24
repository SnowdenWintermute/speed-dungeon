import { GameState } from "@/stores/game-store";
import {
  ActionUserContext,
  CharacterAssociatedData,
  COMBAT_ACTIONS,
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

      const targetingProperties = character.getTargetingProperties();

      const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
      if (selectedActionAndRank === null)
        return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

      const { actionName } = selectedActionAndRank;

      targetingProperties.setSelectedActionAndRank({
        actionName,
        rank: actionLevel,
      });

      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      if (character.combatantProperties.controllingPlayer === null)
        return new Error(ERROR_MESSAGES.COMBATANT.EXPECTED_OWNER_ID_MISSING);

      const playerOption = game.players[character.combatantProperties.controllingPlayer];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

      const targetingCalculator = new TargetingCalculator(
        new ActionUserContext(game, party, character),
        playerOption
      );
      const newTargetsResult = targetingCalculator.updateTargetingSchemeAfterSelectingActionLevel();

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
        actionName,
        character.entityProperties.id,
        targetIds || []
      );
    }
  );
}
