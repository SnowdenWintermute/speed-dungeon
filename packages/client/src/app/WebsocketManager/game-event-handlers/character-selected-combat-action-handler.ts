import { GameState } from "@/stores/game-store";
import {
  AdventuringParty,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  CombatActionName,
  ERROR_MESSAGES,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringCombatActionMenuState } from "@/app/game/ActionMenu/menu-state/considering-combat-action";

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
      const maybeError =
        targetingCalculator.assignInitialCombatantActionTargets(combatActionOption);
      if (maybeError instanceof Error) return maybeError;

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
