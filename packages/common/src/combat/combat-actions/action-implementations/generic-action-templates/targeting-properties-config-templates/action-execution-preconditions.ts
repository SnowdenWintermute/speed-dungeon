import { ActionTracker } from "../../../../../action-processing/action-tracker.js";
import { ActionResolutionStepContext } from "../../../../../action-processing/index.js";
import { CombatantProperties } from "../../../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../../../game/index.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";
import { ActionExecutionPrecondition } from "../../../combat-action-targeting-properties.js";
import { ActionPayableResource, CombatActionComponent } from "../../../index.js";
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
  const { party, actionUser } = context.actionUserContext;
  const combatantProperties = actionUser.getCombatantProperties();

  const isInCombat = party.battleId !== null;
  const selectedActionAndRank = actionUser.getTargetingProperties().getSelectedActionAndRank();

  if (selectedActionAndRank === null) throw new Error("Expected an action to be selected");

  const { costProperties } = self;
  const resourceCosts = costProperties.getResourceCosts(
    actionUser,
    isInCombat,
    selectedActionAndRank.rank
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
  const { actionUser } = context.actionUserContext;
  const combatantProperties = actionUser.getCombatantProperties();
  return !CombatantProperties.isDead(combatantProperties);
}

function targetsAreAlive(
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { actionUserContext } = context;
  const { game, party, actionUser } = actionUserContext;

  const targetsOption = context.tracker.actionExecutionIntent.targets;

  if (!targetsOption) {
    return false;
  }

  const targetingCalculator = new TargetingCalculator(actionUserContext, null);

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
