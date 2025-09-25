import { GameState } from "@/stores/game-store";
import {
  ActionUserContext,
  AdventuringParty,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  EntityId,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringCombatActionMenuState } from "@/app/game/ActionMenu/menu-state/considering-combat-action";
import { synchronizeTargetingIndicators } from "./synchronize-targeting-indicators";
import { ActionAndRank } from "@speed-dungeon/common";

export function characterSelectedCombatActionHandler(
  characterId: string,
  selectedActionAndRank: null | ActionAndRank,
  itemIdOption?: null | EntityId
) {
  characterAssociatedDataProvider(
    characterId,
    ({ character, game, party }: CharacterAssociatedData, gameState: GameState) => {
      const targetingProperties = character.getTargetingProperties();

      targetingProperties.setSelectedActionAndRank(selectedActionAndRank);

      const itemId = itemIdOption === undefined ? null : itemIdOption;
      targetingProperties.setSelectedItemId(itemId);

      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const combatActionOption =
        selectedActionAndRank !== null ? COMBAT_ACTIONS[selectedActionAndRank.actionName] : null;
      if (character.combatantProperties.controllingPlayer === null)
        return new Error(ERROR_MESSAGES.COMBATANT.EXPECTED_OWNER_ID_MISSING);

      const playerOption = game.players[character.combatantProperties.controllingPlayer];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

      const targetingCalculator = new TargetingCalculator(
        new ActionUserContext(game, party, character),
        playerOption
      );
      const newTargetsResult =
        targetingProperties.assignInitialTargetsForSelectedAction(targetingCalculator);
      if (newTargetsResult instanceof Error) return newTargetsResult;

      let targetIds: null | EntityId[] = null;
      if (combatActionOption !== null && newTargetsResult) {
        const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
          combatActionOption,
          newTargetsResult
        );
        if (targetIdsResult instanceof Error) return targetIdsResult;
        targetIds = targetIdsResult;
      }

      const actionName =
        selectedActionAndRank?.actionName === undefined ? null : selectedActionAndRank.actionName;

      synchronizeTargetingIndicators(
        gameState,
        actionName,
        character.entityProperties.id,
        targetIds || []
      );

      const playerOwnsCharacter = AdventuringParty.playerOwnsCharacter(
        party,
        gameState.username,
        characterId
      );

      if (!playerOwnsCharacter || actionName === null) return;

      gameState.stackedMenuStates.push(new ConsideringCombatActionMenuState(actionName));
    }
  );
}
