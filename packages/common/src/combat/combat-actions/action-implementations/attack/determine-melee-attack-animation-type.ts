import { ActionResolutionStepContext } from "../../../../action-processing/index.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { FixedNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { throwIfError } from "../../../../utils/index.js";
import { IncomingResourceChangesCalculator } from "../../../action-results/index.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { CombatActionResource } from "../../combat-action-hit-outcome-properties.js";
import { COMBAT_ACTIONS } from "../index.js";

export enum MeleeAttackAnimationType {
  Unarmed,
  OneHandSwing,
  OneHandStab,
  TwoHandSwing,
  TwoHandStab,
}

export function determineMeleeAttackAnimationType(
  context: ActionResolutionStepContext,
  holdableSlot: HoldableSlotType
): MeleeAttackAnimationType {
  const { actionUser } = context.actionUserContext;
  const combatantProperties = actionUser.getCombatantProperties();

  const equipmentOption = combatantProperties.equipment.getEquippedHoldable(holdableSlot);

  const noUseableEquipmentInSlot =
    !equipmentOption ||
    Equipment.isBroken(equipmentOption) ||
    equipmentOption.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield;

  if (noUseableEquipmentInSlot) return MeleeAttackAnimationType.Unarmed;

  const isTwoHanded = Equipment.isTwoHanded(
    equipmentOption.equipmentBaseItemProperties.equipmentType
  );

  const targetingCalculator = new TargetingCalculator(context.actionUserContext, null);

  const { actionExecutionIntent } = context.tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

  const targetIds = throwIfError(
    targetingCalculator.getCombatActionTargetIds(action, actionExecutionIntent.targets)
  );

  const incomingResourceChangesCalculator = new IncomingResourceChangesCalculator(
    context.actionUserContext,
    actionExecutionIntent,
    targetingCalculator,
    targetIds,
    new FixedNumberGenerator(0.5)
  );

  // we need to see what type of damage we want to do to determine the correct animation
  const incomingResourceChangesOption =
    incomingResourceChangesCalculator.getBaseIncomingResourceChangesPerTarget();

  if (!incomingResourceChangesOption) {
    if (isTwoHanded) return MeleeAttackAnimationType.TwoHandSwing;
    else return MeleeAttackAnimationType.OneHandSwing;
  }

  const incomingHpChanges = incomingResourceChangesOption[CombatActionResource.HitPoints];

  if (!incomingHpChanges) {
    if (isTwoHanded) return MeleeAttackAnimationType.TwoHandSwing;
    else return MeleeAttackAnimationType.OneHandSwing;
  }

  const { kineticDamageTypeOption } = incomingHpChanges.source;

  if (kineticDamageTypeOption === undefined) {
    if (isTwoHanded) return MeleeAttackAnimationType.TwoHandSwing;
    else return MeleeAttackAnimationType.OneHandSwing;
  }

  switch (kineticDamageTypeOption) {
    case KineticDamageType.Blunt:
    case KineticDamageType.Slashing:
      if (isTwoHanded) return MeleeAttackAnimationType.TwoHandSwing;
      else return MeleeAttackAnimationType.OneHandSwing;
    case KineticDamageType.Piercing:
      if (isTwoHanded) return MeleeAttackAnimationType.TwoHandStab;
      else return MeleeAttackAnimationType.OneHandStab;
  }
}
