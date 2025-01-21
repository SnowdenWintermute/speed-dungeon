import { CharacterAssociatedData, ERROR_MESSAGES, InputLock } from "@speed-dungeon/common";
import validateCombatActionUse from "../combat-action-results-processing/validate-combat-action-use.js";
import { getGameServer } from "../../../singletons.js";

export default async function useSelectedCombatActionHandler(
  _eventData: { characterId: string },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  const gameServer = getGameServer();

  if (InputLock.isLocked(party.inputLock)) return new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);

  const { selectedCombatAction } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  // on receipt
  // validate use
  // walk through combat action composite tree depth first, executing child nodes
  // for each child
  // - calculate result including
  //   - resolve triggers for "on use"
  //   - action costs paid
  //   - resource changes on targets
  //   - conditions applied
  //   - resolve triggers for "on hit"
  // - build command on server and apply to game
  // - push the result to a list for the client
  // - check if next child should be executed
  // send the results to client
  // client build commands and applies them to game

  const targetsAndBattleResult = validateCombatActionUse(
    characterAssociatedData,
    selectedCombatAction
  );

  if (targetsAndBattleResult instanceof Error) return targetsAndBattleResult;
  const { targets, battleOption } = targetsAndBattleResult;

  const maybeError = await gameServer.processSelectedCombatAction(
    game,
    party,
    character.entityProperties.id,
    selectedCombatAction,
    targets,
    battleOption,
    party.characterPositions
  );

  if (maybeError instanceof Error) return maybeError;
}
