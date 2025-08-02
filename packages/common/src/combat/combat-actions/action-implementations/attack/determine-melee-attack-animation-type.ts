import { ActionResolutionStepContext } from "../../../../action-processing/index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { AverageRandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { getIncomingResourceChangesPerTarget } from "../../../action-results/index.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";

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
  const { combatantProperties } = context.combatantContext.combatant;

  const equipmentOption = CombatantEquipment.getEquippedHoldable(combatantProperties, holdableSlot);

  const noUseableEquipmentInSlot =
    !equipmentOption ||
    Equipment.isBroken(equipmentOption) ||
    equipmentOption.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield;

  if (noUseableEquipmentInSlot) return MeleeAttackAnimationType.Unarmed;

  const isTwoHanded = Equipment.isTwoHanded(
    equipmentOption.equipmentBaseItemProperties.equipmentType
  );

  // we need to see what type of damage we want to do to determine the correct animation
  const incomingResourceChangesResult = getIncomingResourceChangesPerTarget(
    context,
    new AverageRandomNumberGenerator()
  );
  if (incomingResourceChangesResult instanceof Error) throw incomingResourceChangesResult;
  const { incomingHpChangePerTargetOption } = incomingResourceChangesResult;

  if (!incomingHpChangePerTargetOption) {
    if (isTwoHanded) return MeleeAttackAnimationType.TwoHandSwing;
    else return MeleeAttackAnimationType.OneHandSwing;
  }

  const { kineticDamageTypeOption } = incomingHpChangePerTargetOption.resourceChangeSource;

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
