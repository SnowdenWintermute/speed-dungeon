import { GameState } from "@/stores/game-store";
import {
  AdventuringParty,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  CombatActionName,
  CombatantContext,
  ERROR_MESSAGES,
  EntityId,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringCombatActionMenuState } from "@/app/game/ActionMenu/menu-state/considering-combat-action";
import { synchronizeTargetingIndicators } from "./synchronize-targeting-indicators";

export function characterSelectedCombatActionHandler(
  characterId: string,
  combatActionNameOption: null | CombatActionName,
  combatActionLevel: null | number
) {
  characterAssociatedDataProvider(
    characterId,
    ({ character, game, party }: CharacterAssociatedData, gameState: GameState) => {
      character.combatantProperties.selectedCombatAction = combatActionNameOption;
      character.combatantProperties.selectedActionLevel = combatActionLevel;
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const combatActionOption =
        combatActionNameOption !== null ? COMBAT_ACTIONS[combatActionNameOption] : null;
      if (character.combatantProperties.controllingPlayer === null)
        return new Error(ERROR_MESSAGES.COMBATANT.EXPECTED_OWNER_ID_MISSING);

      const playerOption = game.players[character.combatantProperties.controllingPlayer];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

      const targetingCalculator = new TargetingCalculator(
        new CombatantContext(game, party, character),
        playerOption
      );
      const newTargetsResult =
        targetingCalculator.assignInitialCombatantActionTargets(combatActionOption);
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
