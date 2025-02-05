export * from "./turn-result.js";
export * from "./action-result.js";
export * from "./get-action-results.js";
export * from "./action-result-calculator.js";
export * from "./hp-change-evasion-and-durability-change-result-calculation/index.js";

import cloneDeep from "lodash.clonedeep/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { ActionResult } from "./action-result.js";
import { CombatantProperties } from "../../combatants/index.js";
import {
  ActionResultCalculationArguments,
  ActionResultCalculator,
} from "./action-result-calculator.js";
import { CombatActionType } from "../index.js";
import applyConsumableUseToActionResult from "./apply-consumable-use-to-action-result.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { getCombatActionTargetIds } from "./get-action-target-ids.js";
import { calculateActionHitPointChangesEvasionsAndDurabilityChanges } from "./hp-change-evasion-and-durability-change-result-calculation/index.js";
export * from "./get-action-target-ids.js";

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

  const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, userId);
  if (partyResult instanceof Error) return partyResult;

  const targetIdsResult = getCombatActionTargetIds(
    partyResult,
    combatActionProperties,
    userId,
    args.allyIds,
    args.battleOption,
    targets
  );

  if (targetIdsResult instanceof Error) return targetIdsResult;
  const targetIds = targetIdsResult;
  actionResult.targetIds = targetIds;

  const manaCostOptionResult = ActionResultCalculator.calculateActionManaCost(game, args);
  if (manaCostOptionResult instanceof Error) return manaCostOptionResult;
  if (manaCostOptionResult !== null) actionResult.manaCost = Math.floor(manaCostOptionResult);
  if (combatantProperties.mana < actionResult.manaCost)
    return new Error(ERROR_MESSAGES.ABILITIES.INSUFFICIENT_MANA);

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

  const hitPointChangesCritsEvasionsAndDurabilityChangesResult =
    calculateActionHitPointChangesEvasionsAndDurabilityChanges(
      game,
      args,
      targetIds,
      combatActionProperties
    );
  if (hitPointChangesCritsEvasionsAndDurabilityChangesResult instanceof Error)
    return hitPointChangesCritsEvasionsAndDurabilityChangesResult;
  const { hitPointChanges, evasions, durabilityChanges } =
    hitPointChangesCritsEvasionsAndDurabilityChangesResult;

  if (Object.keys(hitPointChanges).length) actionResult.hitPointChangesByEntityId = hitPointChanges;
  if (Object.keys(evasions).length) actionResult.missesByEntityId = evasions;
  if (Object.keys(durabilityChanges).length) actionResult.durabilityChanges = durabilityChanges;

  return actionResult;
}
