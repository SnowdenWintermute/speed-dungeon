import { ONE_THIRD_OF_ONE } from "../../app-consts.js";
import { Combatant, CombatantEquipment } from "../../combatants/index.js";
import { EquipmentType } from "../../items/equipment/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { EntityId } from "../../primatives/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatActionProperties } from "../combat-actions/combat-action-properties.js";

export interface DurabilityChanges {
  [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, number>>;
  [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, number>>;
}

export function calculateActionDurabilityChangesOnHit(
  actionUser: Combatant,
  targetCombatant: Combatant,
  actionProperties: CombatActionProperties,
  isHit: boolean,
  isCrit: boolean,
  durabilityChanges: { [entityId: EntityId]: DurabilityChanges }
): { [itemId: EntityId]: number } | undefined {
  const {
    entityProperties: targetEntityProperties,
    combatantProperties: targetCombatantProperties,
  } = targetCombatant;
  const targetId = targetEntityProperties.id;
  // determine if ability should cause weapon durability loss on hit
  if (isCrit) {
    // crits damage both wearables and shields if any
    const changes: DurabilityChanges = {};
    changes[EquipmentSlotType.Wearable] = {
      [WearableSlotType.Head]: 1,
      [WearableSlotType.Body]: 1,
    };
    if (
      CombatantEquipment.getEquipmentInSlot(targetCombatantProperties, {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.OffHand,
      })?.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield
    ) {
      changes[EquipmentSlotType.Holdable] = { [HoldableSlotType.OffHand]: 1 };
    }
    durabilityChanges[targetEntityProperties.id] = changes;
  } else if (isHit) {
    // hits damage a random wearable
    const equippedHelmOption = CombatantEquipment.getEquipmentInSlot(targetCombatantProperties, {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.Head,
    });
    const equippedBodyOption = CombatantEquipment.getEquipmentInSlot(targetCombatantProperties, {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.Body,
    });
    if (equippedBodyOption && equippedHelmOption) {
      const whichArmorToHitRoll = Math.random();
      if (whichArmorToHitRoll < ONE_THIRD_OF_ONE) {
        durabilityChanges[targetId] = {
          [EquipmentSlotType.Wearable]: { [WearableSlotType.Head]: 1 },
        };
      } else {
        durabilityChanges[targetId] = {
          [EquipmentSlotType.Wearable]: { [WearableSlotType.Body]: 1 },
        };
      }
    } else if (equippedBodyOption) {
      durabilityChanges[targetId] = {
        [EquipmentSlotType.Wearable]: { [WearableSlotType.Body]: 1 },
      };
    } else if (equippedHelmOption) {
      durabilityChanges[targetId] = {
        [EquipmentSlotType.Wearable]: { [WearableSlotType.Head]: 1 },
      };
    }
  }

  if (isCrit || isHit) {
    // take dura from user's equipment if should
    if (actionProperties.incursDurabilityLoss) {
      if (actionProperties.incursDurabilityLoss[EquipmentSlotType.Wearable])
        for (const [wearableSlot, durabilityLossConditions] of iterateNumericEnumKeyedRecord(
          actionProperties.incursDurabilityLoss[EquipmentSlotType.Wearable]
        )) {
          if (durabilityLossConditions.onHit)
            durabilityChanges[actionUser.entityProperties.id][EquipmentSlotType.Wearable]![
              wearableSlot
            ] = 1;
        }
      if (actionProperties.incursDurabilityLoss[EquipmentSlotType.Holdable])
        for (const [holdableSlot, durabilityLossConditions] of iterateNumericEnumKeyedRecord(
          actionProperties.incursDurabilityLoss[EquipmentSlotType.Holdable]
        )) {
          durabilityChanges[actionUser.entityProperties.id][EquipmentSlotType.Holdable]![
            holdableSlot
          ] = 1;
        }
    }
  }
  return;
}

export function calculateActionDurabilityChangesOnUse() {
  const actionUserDurabilityChanges: DurabilityChanges = {
    [EquipmentSlotType.Wearable]: {},
    [EquipmentSlotType.Holdable]: {},
  };
  if (actionProperties.incursDurabilityLoss) {
    if (actionProperties.incursDurabilityLoss[EquipmentSlotType.Wearable])
      for (const [wearableSlot, durabilityLossConditions] of iterateNumericEnumKeyedRecord(
        actionProperties.incursDurabilityLoss[EquipmentSlotType.Wearable]
      )) {
        if (durabilityLossConditions.onUse) {
          actionUserDurabilityChanges[EquipmentSlotType.Wearable]![wearableSlot] = 1;
        }
      }
    if (actionProperties.incursDurabilityLoss[EquipmentSlotType.Holdable])
      for (const [holdableSlot, durabilityLossConditions] of iterateNumericEnumKeyedRecord(
        actionProperties.incursDurabilityLoss[EquipmentSlotType.Holdable]
      )) {
        if (durabilityLossConditions.onUse) {
          actionUserDurabilityChanges[EquipmentSlotType.Holdable]![holdableSlot] = 1;
        }
      }
  }
}
