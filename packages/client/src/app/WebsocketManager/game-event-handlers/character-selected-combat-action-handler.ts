import { GameState } from "@/stores/game-store";
import {
  AdventuringParty,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  CombatActionName,
  ERROR_MESSAGES,
  EntityId,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringCombatActionMenuState } from "@/app/game/ActionMenu/menu-state/considering-combat-action";
import { synchronizeTargetingIndicators } from "./synchronize-targeting-indicators";

export function characterSelectedCombatActionHandler(
  characterId: string,
  combatActionNameOption: null | CombatActionName
) {
  characterAssociatedDataProvider(
    characterId,
    ({ character, game, party }: CharacterAssociatedData, gameState: GameState) => {
      character.combatantProperties.selectedCombatAction = combatActionNameOption;
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const combatActionOption =
        combatActionNameOption !== null ? COMBAT_ACTIONS[combatActionNameOption] : null;
      if (character.combatantProperties.controllingPlayer === null)
        return new Error(ERROR_MESSAGES.COMBATANT.EXPECTED_OWNER_ID_MISSING);

      const playerOption = game.players[character.combatantProperties.controllingPlayer];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

      const targetingCalculator = new TargetingCalculator(game, party, character, playerOption);
      const newTargetsResult =
        targetingCalculator.assignInitialCombatantActionTargets(combatActionOption);
      if (newTargetsResult instanceof Error) return newTargetsResult;

      const battleOption = (() => {
        if (!party.battleId) return null;
        return game.battles[party.battleId] || null;
      })();

      let targetIds: null | EntityId[] = null;
      if (combatActionOption !== null && newTargetsResult) {
        const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
          combatActionOption,
          battleOption,
          newTargetsResult
        );
        if (targetIdsResult instanceof Error) return targetIdsResult;
        targetIds = targetIdsResult;
      }

      synchronizeTargetingIndicators(
        gameState,
        combatActionNameOption,
        character.entityProperties.id,
        targetIds || []
      );

      const playerOwnsCharacter = AdventuringParty.playerOwnsCharacter(
        party,
        gameState.username,
        characterId
      );

      if (!playerOwnsCharacter || combatActionNameOption === null) return;

      gameState.stackedMenuStates.push(
        new ConsideringCombatActionMenuState(combatActionNameOption)
      );
    }
  );
}
