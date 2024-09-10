import { CharacterAssociatedData, ERROR_MESSAGES } from "@speed-dungeon/common";
import { GameServer } from "../..";
import validateCombatActionUse from "../combat-action-results-processing/validate-combat-action-use";

export default function useSelectedCombatActionHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;

  const { selectedCombatAction } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const targetsAndBattleResult = validateCombatActionUse(
    characterAssociatedData,
    selectedCombatAction
  );
  if (targetsAndBattleResult instanceof Error) return targetsAndBattleResult;
  const { targets, battleOption } = targetsAndBattleResult;

  this.processSelectedCombatAction(
    game,
    party,
    character.entityProperties.id,
    selectedCombatAction,
    targets,
    battleOption,
    party.characterPositions
  );
}
