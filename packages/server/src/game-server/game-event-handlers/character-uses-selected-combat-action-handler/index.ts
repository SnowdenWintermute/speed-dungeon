import {
  ActionResult,
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantAssociatedData,
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
  const combatantContext: CombatantAssociatedData = { game, party, combatant: character };
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
  const { successfulResults, maybeError } = processActionExecutionStack(combatantContext, [
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
  combatantContext: CombatantAssociatedData,
  initialActions: CombatActionComponent[]
): { successfulResults: ActionResult[]; maybeError: null | Error } {
  const { combatant } = combatantContext;
  const results: ActionResult[] = []; // GameUpdateCommand[]
  const actionsToExecute: CombatActionComponent[] = [...initialActions];

  let currentAction = actionsToExecute.pop();
  while (currentAction) {
    if (!currentAction.shouldExecute(combatantContext)) {
      currentAction = actionsToExecute.pop();
      continue;
    }
    // push pre-use animation effects to results and apply
    // push paid costs to results
    // process triggers for "on use" ex: counter spell (continue), deploy shield (process deploy shield result immediately)
    // - should determine ("success" or "failure" state)
    // push on-success or on-failure animation effects
    // push resource changes and conditions applied to results
    // process triggers for "on hit" ex: detonate explosive, interrupt channeling
    // - push triggered actions to the stack
    // process triggers for "on evade" ex: evasion stacks increased
    // build the action commands from the result on server and apply to game
    // continue building the list of action results for the client to use

    // process children recursively
    const childrenOption = currentAction.getChildren(combatant);
    if (childrenOption) {
      // since we'll be popping them, reverse them into the correct order
      const childrenReversed = childrenOption.reverse();
      const childActionResults = processActionExecutionStack(combatantContext, childrenReversed);

      results.push(...childActionResults.successfulResults);
      if (childActionResults.maybeError instanceof Error)
        return { successfulResults: results, maybeError: childActionResults.maybeError };
    }

    currentAction = actionsToExecute.pop();
  }

  return { successfulResults: results, maybeError: null };
}
