import { ActionTracker } from "../../../../../action-processing/action-tracker.js";
import { CombatantContext } from "../../../../../combatant-context/index.js";
import { CombatantProperties } from "../../../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../../../game/index.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";
import { ActionExecutionPrecondition } from "../../../combat-action-targeting-properties.js";
import {
  ActionPayableResource,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
} from "../../../index.js";

export enum ActionExecutionPreconditions {
  HasEnoughActionPoints,
  UserIsAlive,
  TargetsAreAlive,
}

export const ACTION_EXECUTION_PRECONDITIONS: Record<
  ActionExecutionPreconditions,
  ActionExecutionPrecondition
> = {
  [ActionExecutionPreconditions.HasEnoughActionPoints]: hasEnoughActionPoints,
  [ActionExecutionPreconditions.UserIsAlive]: userIsAlive,
  [ActionExecutionPreconditions.TargetsAreAlive]: targetsAreAlive,
};

function hasEnoughActionPoints(
  combatantContext: CombatantContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { party, combatant } = combatantContext;
  const { combatantProperties } = combatant;

  // @TODO - actually select the action level since some action level might cost more
  const isInCombat = party.battleId !== null;
  const { selectedActionLevel } = combatantProperties;

  if (selectedActionLevel === null) throw new Error("expected to have a selectedActionLevel");

  const { costProperties } = self;
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

function userIsAlive(
  combatantContext: CombatantContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { combatant } = combatantContext;
  return !CombatantProperties.isDead(combatant.combatantProperties);
}

function targetsAreAlive(
  combatantContext: CombatantContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { game, party, combatant } = combatantContext;

  const targetsOption = combatant.combatantProperties.combatActionTarget;
  if (!targetsOption) {
    console.log(COMBAT_ACTION_NAME_STRINGS[self.name], "noTargets");
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
    console.log(COMBAT_ACTION_NAME_STRINGS[self.name], "noTargets length");
    return false;
  }

  return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
}
