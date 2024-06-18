import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonGame } from "../../game";
import { ActionResult } from "./action-result";
import { CombatantProperties } from "../../combatants";
import {
  ActionResultCalculationArguments,
  ActionResultCalculator,
} from "./action-result-calculator";
import calculateActionHitPointChangesCritsAndEvasions from "./hp-change-result-calculation";

export default function calculateActionResult(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
) {
  const { userId, combatAction, targets } = args;
  const actionResult = new ActionResult(userId, cloneDeep(combatAction), cloneDeep(targets));
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties } = combatantResult;

  const actionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
    combatantProperties,
    combatAction
  );
  if (actionPropertiesResult instanceof Error) return actionPropertiesResult;
  const combatActionProperties = actionPropertiesResult;
  actionResult.endsTurn = combatActionProperties.requiresCombatTurn;

  const targetIdsResult = ActionResultCalculator.getCombatActionTargetIds(game, args);
  if (targetIdsResult instanceof Error) return targetIdsResult;
  const targetIds = targetIdsResult;

  const manaCostOptionResult = ActionResultCalculator.calculateActionManaCost(game, args);
  if (manaCostOptionResult instanceof Error) return manaCostOptionResult;
  if (manaCostOptionResult !== null) {
    if (actionResult.manaCostsPaidByEntityId === null) actionResult.manaCostsPaidByEntityId = {};
    actionResult.manaCostsPaidByEntityId[userId] = manaCostOptionResult;
  }

  const hitPointChangesCritsAndEvasionsResult = calculateActionHitPointChangesCritsAndEvasions(
    game,
    args,
    targetIds,
    combatActionProperties
  );
  if (hitPointChangesCritsAndEvasionsResult instanceof Error)
    return hitPointChangesCritsAndEvasionsResult;
  const { hitPointChanges, crits, evasions } = hitPointChangesCritsAndEvasionsResult;
  actionResult.hitPointChangesByEntityId = hitPointChanges;
  actionResult.critsByEntityId = crits;
  actionResult.missesByEntityId = evasions;

  return actionResult;
}
