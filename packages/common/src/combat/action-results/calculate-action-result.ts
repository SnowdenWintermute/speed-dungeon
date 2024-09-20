import cloneDeep from "lodash.clonedeep/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { ActionResult } from "./action-result.js";
import { CombatantProperties } from "../../combatants/index.js";
import {
  ActionResultCalculationArguments,
  ActionResultCalculator,
} from "./action-result-calculator.js";
import calculateActionHitPointChangesCritsAndEvasions from "./hp-change-result-calculation/index.js";
import { CombatActionType } from "../index.js";
import applyConsumableUseToActionResult from "./apply-consumable-use-to-action-result.js";
import { ERROR_MESSAGES } from "../../errors/index.js";

export default function calculateActionResult(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
): Error | ActionResult {
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
  actionResult.targetIds = targetIds;

  const manaCostOptionResult = ActionResultCalculator.calculateActionManaCost(game, args);
  if (manaCostOptionResult instanceof Error) return manaCostOptionResult;
  if (manaCostOptionResult !== null) actionResult.manaCost = Math.floor(manaCostOptionResult);
  if (combatantProperties.mana < actionResult.manaCost)
    return new Error(ERROR_MESSAGES.ABILITIES.INSUFFICIENT_MANA);
  console.log("MANA COST: ", actionResult.manaCost);

  // CONSUMABLE ONLY
  if (combatAction.type === CombatActionType.ConsumableUsed) {
    const maybeError = applyConsumableUseToActionResult(
      game,
      actionResult,
      combatAction,
      targetIds,
      combatantResult
    );
    if (maybeError instanceof Error) console.error(maybeError);
    if (maybeError instanceof Error) return maybeError;
  }
  // END CONSUMABLE

  const hitPointChangesCritsAndEvasionsResult = calculateActionHitPointChangesCritsAndEvasions(
    game,
    args,
    targetIds,
    combatActionProperties
  );
  if (hitPointChangesCritsAndEvasionsResult instanceof Error)
    return hitPointChangesCritsAndEvasionsResult;
  const { hitPointChanges, crits, evasions } = hitPointChangesCritsAndEvasionsResult;
  if (Object.keys(hitPointChanges).length) actionResult.hitPointChangesByEntityId = hitPointChanges;
  if (Object.keys(crits).length) actionResult.critsByEntityId = crits;
  if (Object.keys(evasions).length) actionResult.missesByEntityId = evasions;

  return actionResult;
}
