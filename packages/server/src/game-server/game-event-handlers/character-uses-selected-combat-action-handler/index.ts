import { CharacterAssociatedData, ERROR_MESSAGES, InputLock } from "@speed-dungeon/common";
import { GameServer } from "../..";
import validateCombatActionUse from "../combat-action-results-processing/validate-combat-action-use";

export default function useSelectedCombatActionHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;

  if (InputLock.isLocked(party.inputLock)) return new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);

  const { selectedCombatAction } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const targetsAndBattleResult = validateCombatActionUse(
    characterAssociatedData,
    selectedCombatAction
  );

  if (targetsAndBattleResult instanceof Error) return targetsAndBattleResult;
  const { targets, battleOption } = targetsAndBattleResult;

  return this.processSelectedCombatAction(
    game,
    party,
    character.entityProperties.id,
    selectedCombatAction,
    targets,
    battleOption,
    party.characterPositions
  );
}
