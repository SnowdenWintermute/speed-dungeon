import { GameState, getCurrentMenu } from "@/stores/game-store";
import {
  AdventuringParty,
  CharacterAssociatedData,
  CombatAction,
  ERROR_MESSAGES,
  SpeedDungeonGame,
  getCombatActionProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringCombatActionMenuState } from "@/app/game/ActionMenu/menu-state/considering-combat-action";

export default function characterSelectedCombatActionHandler(
  characterId: string,
  combatActionOption: null | CombatAction
) {
  characterAssociatedDataProvider(
    characterId,
    ({ character, game, party }: CharacterAssociatedData, gameState: GameState) => {
      character.combatantProperties.selectedCombatAction = combatActionOption;
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);

      const combatActionPropertiesOption = combatActionOption
        ? getCombatActionProperties(party, combatActionOption, characterId)
        : null;
      if (combatActionPropertiesOption instanceof Error) return combatActionPropertiesOption;
      if (character.combatantProperties.controllingPlayer === null)
        return new Error(ERROR_MESSAGES.COMBATANT.EXPECTED_OWNER_ID_MISSING);

      SpeedDungeonGame.assignCharacterActionTargets(
        game,
        characterId,
        character.combatantProperties.controllingPlayer,
        combatActionPropertiesOption
      );

      const playerOwnsCharacter = AdventuringParty.playerOwnsCharacter(
        party,
        gameState.username,
        characterId
      );

      if (!playerOwnsCharacter || !combatActionOption) return;

      gameState.stackedMenuStates.push(new ConsideringCombatActionMenuState(combatActionOption));
    }
  );
}
