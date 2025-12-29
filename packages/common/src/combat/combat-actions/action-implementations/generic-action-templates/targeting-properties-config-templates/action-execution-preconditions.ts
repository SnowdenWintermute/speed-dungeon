import { ActionResolutionStepContext } from "../../../../../action-processing/action-steps/index.js";
import { ActionTracker } from "../../../../../action-processing/action-tracker.js";
import { Combatant } from "../../../../../combatants/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../../items/equipment/slots.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";
import { ActionPayableResource } from "../../../action-calculation-utils/action-costs.js";
import { ActionExecutionPrecondition } from "../../../combat-action-targeting-properties.js";
import { CombatActionComponent } from "../../../index.js";
import { MeleeAttackAnimationType } from "../../attack/determine-melee-attack-animation-type.js";

export enum ActionExecutionPreconditions {
  HasEnoughActionPoints,
  UserIsAlive,
  TargetsAreAlive,
  WasNotCounterattacked,
  WasNotWearing2HWeaponOnPreviousAction,
  NaturalUnarmedIsNotTwoHanded,
  NoPetCurrentlySummoned,
  PetCurrentlySummoned,
  PetSlotNotEmpty,
  OffhandIsNotShield,
}

export const ACTION_EXECUTION_PRECONDITIONS: Record<
  ActionExecutionPreconditions,
  ActionExecutionPrecondition
> = {
  [ActionExecutionPreconditions.HasEnoughActionPoints]: hasEnoughActionPoints,
  [ActionExecutionPreconditions.UserIsAlive]: userIsAlive,
  [ActionExecutionPreconditions.TargetsAreAlive]: targetsAreAlive,
  [ActionExecutionPreconditions.WasNotCounterattacked]: wasNotCounterattacked,
  [ActionExecutionPreconditions.NaturalUnarmedIsNotTwoHanded]: (context) => {
    const { actionUser } = context.actionUserContext;
    const naturalMainhandOption = actionUser.getNaturalUnarmedWeapons()[HoldableSlotType.MainHand];
    return !naturalMainhandOption?.equipment.isTwoHanded();
  },
  [ActionExecutionPreconditions.WasNotWearing2HWeaponOnPreviousAction]:
    wasWearing2HWeaponOnPreviousAction,
  [ActionExecutionPreconditions.NoPetCurrentlySummoned]: function (
    context: ActionResolutionStepContext
  ) {
    const { party, actionUser } = context.actionUserContext;
    const petOption = party.petManager.getCombatantSummonedPetOption(actionUser.getEntityId());
    return petOption === undefined;
  },
  [ActionExecutionPreconditions.PetCurrentlySummoned]: function (...args): boolean {
    const shouldSucceed = !ACTION_EXECUTION_PRECONDITIONS[
      ActionExecutionPreconditions.NoPetCurrentlySummoned
    ](...args);
    return shouldSucceed;
  },
  [ActionExecutionPreconditions.PetSlotNotEmpty]: petSlotNotEmpty,
  [ActionExecutionPreconditions.OffhandIsNotShield]: function (
    context: ActionResolutionStepContext,
    previousTrackerOption: undefined | ActionTracker,
    self: CombatActionComponent
  ): boolean {
    const equipmentOption = context.actionUserContext.actionUser.getEquipmentOption();
    if (!equipmentOption) {
      return true;
    }

    const offhandEquipmentOption = equipmentOption.getEquipmentInSlot({
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.OffHand,
    });
    if (offhandEquipmentOption === undefined) {
      return true;
    }

    const shouldSucceed = !offhandEquipmentOption.isShield();
    return shouldSucceed;
  },
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
  const actionPoints = combatantProperties.resources.getActionPoints();

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
  return !combatantProperties.isDead();
}

function targetsAreAlive(
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { actionUserContext } = context;
  const { party } = actionUserContext;

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

  const targetCombatants = party.combatantManager.getExpectedCombatants(targetIdsResult);
  const targetsAreAlive = !Combatant.groupIsDead(targetCombatants);

  return targetsAreAlive;
}

function petSlotNotEmpty(
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { party, actionUser } = context.actionUserContext;

  const selectedActionAndRank = actionUser.getTargetingProperties().getSelectedActionAndRank();

  if (selectedActionAndRank === null) {
    throw new Error("Expected an action to be selected");
  }

  const slotIndex = selectedActionAndRank.rank - 1;

  const petOption = party.petManager.getUnsummonedPetOptionByOwnerAndSlot(
    actionUser.getEntityId(),
    slotIndex
  );

  if (petOption !== undefined) {
    return true;
  }

  return false;
}
