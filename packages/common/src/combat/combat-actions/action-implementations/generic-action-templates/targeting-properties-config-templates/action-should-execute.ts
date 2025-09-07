import { ActionTracker } from "../../../../../action-processing/action-tracker.js";
import { CombatantContext } from "../../../../../combatant-context/index.js";
import { CombatantProperties } from "../../../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../../../game/index.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";
import {
  ActionPayableResource,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
} from "../../../index.js";

export function actionShouldExecute(
  combatantContext: CombatantContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { game, party, combatant } = combatantContext;
  const { combatantProperties } = combatant;

  // @TODO - actually select the action level since some action level might cost more
  const isInCombat = party.battleId !== null;
  const apCostMet = hasEnoughActionPoints(combatantProperties, self, isInCombat);
  if (!apCostMet) return false;

  const targetsOption = combatant.combatantProperties.combatActionTarget;
  if (!targetsOption) {
    return false;
  }

  const targetingCalculator = new TargetingCalculator(
    new CombatantContext(game, party, combatant),
    null
  );

  const targetIdsResult = targetingCalculator.getCombatActionTargetIds(self, targetsOption);
  if (targetIdsResult instanceof Error) {
    console.trace(targetIdsResult);
    return false;
  }

  if (targetIdsResult.length === 0) {
    return false;
  }

  // if previous was countered, don't continue the queued action sequence
  if (previousTrackerOption) {
    const wasCountered = previousTrackerOption.wasCountered();
    if (wasCountered) return false;
  }

  return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
}

function hasEnoughActionPoints(
  combatantProperties: CombatantProperties,
  action: CombatActionComponent,
  isInCombat: boolean,
  selectedActionLevel: number = 1
) {
  const { costProperties } = action;
  const resourceCosts = costProperties.getResourceCosts(
    combatantProperties,
    isInCombat,
    selectedActionLevel
  );
  if (resourceCosts === null) return true;
  const actionPointCost = resourceCosts[ActionPayableResource.ActionPoints] || 0;
  const { actionPoints } = combatantProperties;

  if (actionPoints >= Math.abs(actionPointCost)) return true;

  return false;
}
