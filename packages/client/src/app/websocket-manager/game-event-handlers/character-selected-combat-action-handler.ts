import { GameState } from "@/stores/game-store";
import {
  ActionUserContext,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  EntityId,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringCombatActionMenuState } from "@/app/game/ActionMenu/menu-state/considering-combat-action";
import { ActionAndRank } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";

export function characterSelectedCombatActionHandler(
  characterId: string,
  selectedActionAndRank: null | ActionAndRank,
  itemIdOption?: null | EntityId
) {
  characterAssociatedDataProvider(
    characterId,
    ({ character, game, party }: CharacterAssociatedData, gameState: GameState) => {
      const { actionMenuStore } = AppStore.get();

      const targetingProperties = character.getTargetingProperties();

      targetingProperties.setSelectedActionAndRank(selectedActionAndRank);

      const itemId = itemIdOption === undefined ? null : itemIdOption;
      targetingProperties.setSelectedItemId(itemId);

      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const combatActionOption =
        selectedActionAndRank !== null ? COMBAT_ACTIONS[selectedActionAndRank.actionName] : null;

      const playerOption = game.players[character.combatantProperties.controlledBy.controllerName];
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

      AppStore.get().targetIndicatorStore.synchronize(
        actionName,
        character.getEntityId(),
        targetIds || []
      );

      const playerOwnsCharacter = party.combatantManager.playerOwnsCharacter(
        gameState.username,
        characterId
      );

      if (!playerOwnsCharacter || actionName === null) return;

      actionMenuStore.pushStack(new ConsideringCombatActionMenuState(actionName));
    }
  );
}
