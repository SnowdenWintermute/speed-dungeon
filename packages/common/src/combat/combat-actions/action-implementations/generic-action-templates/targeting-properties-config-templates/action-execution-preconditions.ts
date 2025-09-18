import { ActionTracker } from "../../../../../action-processing/action-tracker.js";
import { ActionResolutionStepContext } from "../../../../../action-processing/index.js";
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
import { MeleeAttackAnimationType } from "../../attack/determine-melee-attack-animation-type.js";

export enum ActionExecutionPreconditions {
  HasEnoughActionPoints,
  UserIsAlive,
  TargetsAreAlive,
  WasNotCounterattacked,
  WasNotWearing2HWeaponOnPreviousAction,
  ProjectileWasNotIncinerated,
}

export const ACTION_EXECUTION_PRECONDITIONS: Record<
  ActionExecutionPreconditions,
  ActionExecutionPrecondition
> = {
  [ActionExecutionPreconditions.HasEnoughActionPoints]: hasEnoughActionPoints,
  [ActionExecutionPreconditions.UserIsAlive]: userIsAlive,
  [ActionExecutionPreconditions.TargetsAreAlive]: targetsAreAlive,
  [ActionExecutionPreconditions.WasNotCounterattacked]: wasNotCounterattacked,
  [ActionExecutionPreconditions.WasNotWearing2HWeaponOnPreviousAction]:
    wasWearing2HWeaponOnPreviousAction,
  [ActionExecutionPreconditions.ProjectileWasNotIncinerated]: projectileWasNotIncinerated,
};

function wasWearing2HWeaponOnPreviousAction(
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  return !(
    previousTrackerOption?.meleeAttackAnimationType === MeleeAttackAnimationType.TwoHandStab ||
    previousTrackerOption?.meleeAttackAnimationType === MeleeAttackAnimationType.TwoHandSwing
  );
}

function wasNotCounterattacked(
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  return !previousTrackerOption?.wasCountered();
}

function projectileWasNotIncinerated(
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  return !context.tracker.projectileWasIncinerated;
}

function hasEnoughActionPoints(
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { party, combatant } = context.combatantContext;
  const { combatantProperties } = combatant;

  // @TODO - actually select the action level since some action level might cost more
  const isInCombat = party.battleId !== null;
  let { selectedActionLevel } = combatantProperties;

  if (selectedActionLevel === null) {
    console.info("selectedActionLevel was null, setting to 1");
    combatantProperties.selectedActionLevel = selectedActionLevel = 1;
  }

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
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { combatant } = context.combatantContext;
  return !CombatantProperties.isDead(combatant.combatantProperties);
}

function targetsAreAlive(
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { game, party, combatant } = context.combatantContext;

  const targetsOption = context.tracker.actionExecutionIntent.targets;

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

  return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
}
