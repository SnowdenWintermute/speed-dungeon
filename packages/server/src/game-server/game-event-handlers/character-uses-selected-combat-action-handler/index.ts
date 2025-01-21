import {
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

  // on receipt
  // validate use
  // walk through combat action composite tree depth first, executing child nodes
  // for each child
  // - calculate result including
  //   - action costs paid
  //   - resolve triggers for "on use"
  //   - resource changes on targets
  //   - conditions applied
  //   - resolve triggers for "on hit"
  // - build command on server and apply to game
  // - push the result to a list for the client
  // - check if next child should be executed
  // send the results to client
  // client build commands and applies them to game

  // const results = []
  const actionsToExecute: CombatActionComponent[] = [selectedCombatAction];
  while (actionsToExecute.length > 0) {
    // push paid costs to results
    // process triggers for "on use" ex: counter spell (continue), deploy shield (process deploy shield result immediately)
    // push resource changes and conditions applied to results
    // process triggers for "on hit" ex: detonate explosive
    // process triggers for "on evade" ex: evasion stacks increased
    // get children and push them to actionsToExecute stack
  }

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

function processActionExecutionStack(initialActions: CombatActionComponent[]) {
  // const results = []
  const actionsToExecute: CombatActionComponent[] = initialActions;
  while (actionsToExecute.length > 0) {
    // const currentAction = actionsToExecute.pop();
    // push paid costs to results
    // process triggers for "on use" ex: counter spell (continue), deploy shield (process deploy shield result immediately)
    // push resource changes and conditions applied to results
    // process triggers for "on hit" ex: detonate explosive
    // process triggers for "on evade" ex: evasion stacks increased
    // get children and push to stack
    // if !( currentAction.shouldExecuteNextChild() ) break
  }
  // return results
}
