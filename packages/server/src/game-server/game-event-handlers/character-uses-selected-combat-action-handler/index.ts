import {
  ActionResult,
  CharacterAssociatedData,
  CombatActionComponent,
  CombatActionName,
  ERROR_MESSAGES,
  InputLock,
} from "@speed-dungeon/common";
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

  // ON RECEIPT
  // validate use

  const targetsAndBattleResult = validateCombatActionUse(
    characterAssociatedData,
    selectedCombatAction
  );
  // walk through combat action composite tree depth first, executing child nodes
  const { successfulResults, maybeError } = processActionExecutionStack(characterAssociatedData, [
    selectedCombatAction,
  ]);

  // send the successfulResults to client for processing
  // send the error as well

  if (targetsAndBattleResult instanceof Error) return targetsAndBattleResult;
  const { targets, battleOption } = targetsAndBattleResult;

  // const maybeError = await gameServer.processSelectedCombatAction(
  //   game,
  //   party,
  //   character.entityProperties.id,
  //   selectedCombatAction,
  //   targets,
  //   battleOption,
  //   party.characterPositions
  // );

  // if (maybeError instanceof Error) return maybeError;
}

function processActionExecutionStack(
  characterAssociatedData: CharacterAssociatedData,
  initialActions: CombatActionComponent[]
): { successfulResults: ActionResult[]; maybeError: null | Error } {
  const { character } = characterAssociatedData;
  const results: ActionResult[] = [];
  const actionsToExecute: CombatActionComponent[] = [...initialActions];

  let currentAction = actionsToExecute.pop();
  while (currentAction) {
    if (!currentAction.shouldExecute(characterAssociatedData)) {
      currentAction = actionsToExecute.pop();
      continue;
    }
    // push paid costs to results
    // process triggers for "on use" ex: counter spell (continue), deploy shield (process deploy shield result immediately)
    // push resource changes and conditions applied to results
    // process triggers for "on hit" ex: detonate explosive, interrupt channeling
    // process triggers for "on evade" ex: evasion stacks increased
    // build the action commands from the result on server and apply to game
    // continue building the list of action results for the client to use

    // process children recursively
    const childrenOption = currentAction.getChildren(character);
    if (childrenOption) {
      // since we'll be popping them, reverse them into the correct order
      const childrenReversed = childrenOption.reverse();
      const childActionResults = processActionExecutionStack(
        characterAssociatedData,
        childrenReversed
      );

      results.push(...childActionResults.successfulResults);
      if (childActionResults.maybeError instanceof Error)
        return { successfulResults: results, maybeError: childActionResults.maybeError };
    }

    currentAction = actionsToExecute.pop();
  }

  return { successfulResults: results, maybeError: null };
}
