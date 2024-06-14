import cloneDeep from "lodash.clonedeep";
import { ActionResultCalculationArguments, ActionResultCalculator } from ".";
import { SpeedDungeonGame } from "../../../game";
import { ActionResult } from "../action-result";
import { getCombatActionPropertiesIfOwned } from "../../../combatants";

export default function calculateActionHitPointAndManaChanges(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
) {
  const { userId, combatAction, targets } = args;
  const actionResult = new ActionResult(userId, cloneDeep(combatAction), cloneDeep(targets));
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties } = combatantResult;

  const actionPropertiesResult = getCombatActionPropertiesIfOwned(
    combatantProperties,
    combatAction
  );
  if (actionPropertiesResult instanceof Error) return actionPropertiesResult;
  actionResult.endsTurn = actionPropertiesResult.requiresCombatTurn;

  const manaCostOptionResult = ActionResultCalculator.calculateActionManaCost(game, args);
  if (manaCostOptionResult instanceof Error) return manaCostOptionResult;
  if (manaCostOptionResult !== null) {
    if (actionResult.manaCostsPaidByEntityId === null) actionResult.manaCostsPaidByEntityId = {};
    actionResult.manaCostsPaidByEntityId[userId] = manaCostOptionResult;
  }

  // mutate action result with hp changes
}
