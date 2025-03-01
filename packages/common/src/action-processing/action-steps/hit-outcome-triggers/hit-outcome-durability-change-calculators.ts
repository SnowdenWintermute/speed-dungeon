import { ONE_THIRD_OF_ONE } from "../../../app-consts.js";
import { DurabilityLossCondition } from "../../../combat/combat-actions/combat-action-durability-loss-condition.js";
import { CombatActionComponent, HitOutcome } from "../../../combat/index.js";
import { Combatant, CombatantEquipment } from "../../../combatants/index.js";
import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import {
  Equipment,
  EquipmentSlotType,
  EquipmentType,
  HoldableSlotType,
  WearableSlotType,
} from "../../../items/equipment/index.js";
import { EntityId } from "../../../primatives/index.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";

const BASE_DURABILITY_LOSS = -1;
const HIT_OUTCOMES_THAT_CONTACT_TARGET = [
  HitOutcome.Parry,
  HitOutcome.Hit,
  HitOutcome.ShieldBlock,
  HitOutcome.Counterattack,
];

export function addHitOutcomeDurabilityChanges(
  durabilityChanges: DurabilityChangesByEntityId,
  actionUser: Combatant,
  targetCombatant: Combatant,
  action: CombatActionComponent,
  hitOutcomeType: HitOutcome,
  isCrit?: boolean
): Error | { [itemId: EntityId]: number } | undefined {
  // healing magic shouldn't cause durability loss
  const hpChangeProperties = action.getHpChangeProperties(
    actionUser.combatantProperties,
    targetCombatant.combatantProperties
  );
  if (hpChangeProperties?.hpChangeSource.isHealing) return;

  hitOutcomeDurabilityChangeOnTargetUpdaters[hitOutcomeType](
    durabilityChanges,
    targetCombatant,
    isCrit
  );

  if (HIT_OUTCOMES_THAT_CONTACT_TARGET.includes(hitOutcomeType))
    // ex: the action user's weapon should lose durability
    updateConditionalDurabilityChangesOnUser(
      actionUser.entityProperties.id,
      action,
      durabilityChanges,
      DurabilityLossCondition.OnHit
    );
}

const hitOutcomeDurabilityChangeOnTargetUpdaters: Record<
  HitOutcome,
  (
    durabilityChanges: DurabilityChangesByEntityId,
    targetCombatant: Combatant,
    isCrit?: boolean
  ) => void
> = {
  [HitOutcome.Miss]: () => {},
  [HitOutcome.Evade]: () => {},
  [HitOutcome.Parry]: (durabilityChanges, targetCombatant) => {
    throw new Error("Function not implemented.");
  },
  [HitOutcome.Counterattack]: (durabilityChanges, targetCombatant) => {
    throw new Error("Function not implemented.");
  },
  [HitOutcome.ShieldBlock]: (durabilityChanges, targetCombatant, isCrit) => {
    throw new Error("Function not implemented.");
  },
  [HitOutcome.Hit]: (durabilityChanges, targetCombatant, isCrit) => {
    throw new Error("Function not implemented.");
  },
};

function updateDurabilityChangesOnTargetForHit(
  durabilityChanges: DurabilityChangesByEntityId,
  targetCombatant: Combatant
) {
  const { combatantProperties: targetCombatantProperties } = targetCombatant;
  const targetId = targetCombatant.entityProperties.id;

  // hits damage a random wearable
  const equippedHelmOption = CombatantEquipment.getEquipmentInSlot(targetCombatantProperties, {
    type: EquipmentSlotType.Wearable,
    slot: WearableSlotType.Head,
  });
  const equippedBodyOption = CombatantEquipment.getEquipmentInSlot(targetCombatantProperties, {
    type: EquipmentSlotType.Wearable,
    slot: WearableSlotType.Body,
  });
  if (
    equippedBodyOption &&
    !Equipment.isBroken(equippedBodyOption) &&
    equippedHelmOption &&
    !Equipment.isBroken(equippedHelmOption)
  ) {
    const whichArmorToHitRoll = Math.random();
    if (whichArmorToHitRoll < ONE_THIRD_OF_ONE) {
      durabilityChanges.updateOrCreateDurabilityChangeRecord(targetId, {
        taggedSlot: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Head },
        value: BASE_DURABILITY_LOSS,
      });
    } else {
      durabilityChanges.updateOrCreateDurabilityChangeRecord(targetId, {
        taggedSlot: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Body },
        value: BASE_DURABILITY_LOSS,
      });
    }
  } else if (equippedBodyOption && !Equipment.isBroken(equippedBodyOption)) {
    durabilityChanges.updateOrCreateDurabilityChangeRecord(targetId, {
      taggedSlot: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Body },
      value: BASE_DURABILITY_LOSS,
    });
  } else if (equippedHelmOption && !Equipment.isBroken(equippedHelmOption)) {
    durabilityChanges.updateOrCreateDurabilityChangeRecord(targetId, {
      taggedSlot: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Head },
      value: BASE_DURABILITY_LOSS,
    });
  }
}

function updateDurabilityChangesOnTargetForCrit(
  durabilityChanges: DurabilityChangesByEntityId,
  targetCombatant: Combatant
) {
  const { combatantProperties: targetCombatantProperties } = targetCombatant;
  const targetId = targetCombatant.entityProperties.id;

  // crits damage both wearables and shields if any
  durabilityChanges.updateOrCreateDurabilityChangeRecord(targetId, {
    taggedSlot: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Head },
    value: BASE_DURABILITY_LOSS,
  });
  durabilityChanges.updateOrCreateDurabilityChangeRecord(targetId, {
    taggedSlot: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Body },
    value: BASE_DURABILITY_LOSS,
  });
  if (
    CombatantEquipment.getEquipmentInSlot(targetCombatantProperties, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.OffHand,
    })?.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield
  ) {
    durabilityChanges.updateOrCreateDurabilityChangeRecord(targetId, {
      taggedSlot: { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand },
      value: BASE_DURABILITY_LOSS,
    });
  }
}

export function updateConditionalDurabilityChangesOnUser(
  userId: EntityId,
  action: CombatActionComponent,
  durabilityChanges: DurabilityChangesByEntityId,
  condition: DurabilityLossCondition
) {
  // take dura from user's equipment if should
  if (action.incursDurabilityLoss === undefined) return;

  if (action.incursDurabilityLoss[EquipmentSlotType.Wearable]) {
    for (const [wearableSlot, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
      action.incursDurabilityLoss[EquipmentSlotType.Wearable]
    )) {
      if (!(durabilityLossCondition === condition)) continue;

      durabilityChanges.updateOrCreateDurabilityChangeRecord(userId, {
        taggedSlot: { type: EquipmentSlotType.Wearable, slot: wearableSlot },
        value: BASE_DURABILITY_LOSS,
      });
    }
  }

  if (action.incursDurabilityLoss[EquipmentSlotType.Holdable]) {
    for (const [holdableSlot, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
      action.incursDurabilityLoss[EquipmentSlotType.Holdable]
    )) {
      if (!(durabilityLossCondition === condition)) continue;
      durabilityChanges.updateOrCreateDurabilityChangeRecord(userId, {
        taggedSlot: { type: EquipmentSlotType.Holdable, slot: holdableSlot },
        value: BASE_DURABILITY_LOSS,
      });
    }
  }
}
