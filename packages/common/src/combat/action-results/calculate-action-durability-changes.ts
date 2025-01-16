import { ONE_THIRD_OF_ONE } from "../../app-consts.js";
import { Combatant, CombatantEquipment } from "../../combatants/index.js";
import { EQUIPMENT_TYPE_STRINGS, Equipment, EquipmentType } from "../../items/equipment/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { EntityId } from "../../primatives/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import {
  CombatActionProperties,
  DurabilityLossCondition,
} from "../combat-actions/combat-action-properties.js";

const BASE_DURABILITY_LOSS = -1;

export interface EquipmentDurabilityChange {
  taggedSlot: TaggedEquipmentSlot;
  value: number;
}

export class DurabilityChanges {
  changes: EquipmentDurabilityChange[] = [];
  constructor() {}

  addOrUpdateEquipmentDurabilityChange(durabilityChange: EquipmentDurabilityChange) {
    const { taggedSlot, value } = durabilityChange;

    const existingRecord = this.changes.find(
      (change) =>
        change.taggedSlot.type === taggedSlot.type && change.taggedSlot.slot === taggedSlot.slot
    );
    if (existingRecord) {
      existingRecord.value += value;
    } else {
      this.changes.push(durabilityChange);
    }
  }
}

export class DurabilityChangesByEntityId {
  records: { [entityId: EntityId]: DurabilityChanges } = {};
  constructor() {}

  updateOrCreateDurabilityChangeRecord(
    entityId: EntityId,
    durabilityChange: EquipmentDurabilityChange
  ) {
    let existingChanges = this.records[entityId];
    if (!existingChanges) existingChanges = this.records[entityId] = new DurabilityChanges();
    existingChanges.addOrUpdateEquipmentDurabilityChange(durabilityChange);
  }
}

export function calculateActionDurabilityChangesOnHit(
  actionUser: Combatant,
  targetCombatant: Combatant,
  actionProperties: CombatActionProperties,
  isHit: boolean,
  isCrit: boolean,
  durabilityChanges: DurabilityChangesByEntityId
): { [itemId: EntityId]: number } | undefined {
  // determine if ability should cause weapon durability loss on hit
  if (isCrit) {
    updateDurabilityChangesOnTargetForCrit(durabilityChanges, targetCombatant);
  } else if (isHit) {
    updateDurabilityChangesOnTargetForHit(durabilityChanges, targetCombatant);
  }

  if (isCrit || isHit) {
    updateConditionalDurabilityChangesOnUser(
      actionUser.entityProperties.id,
      actionProperties,
      durabilityChanges,
      DurabilityLossCondition.OnHit
    );
  }
  return;
}

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
  actionProperties: CombatActionProperties,
  durabilityChanges: DurabilityChangesByEntityId,
  condition: DurabilityLossCondition
) {
  // take dura from user's equipment if should
  if (actionProperties.incursDurabilityLoss === undefined) return;

  if (actionProperties.incursDurabilityLoss[EquipmentSlotType.Wearable])
    for (const [wearableSlot, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
      actionProperties.incursDurabilityLoss[EquipmentSlotType.Wearable]
    )) {
      if (!(durabilityLossCondition === condition)) continue;
      durabilityChanges.updateOrCreateDurabilityChangeRecord(userId, {
        taggedSlot: { type: EquipmentSlotType.Wearable, slot: wearableSlot },
        value: BASE_DURABILITY_LOSS,
      });
    }

  if (actionProperties.incursDurabilityLoss[EquipmentSlotType.Holdable])
    for (const [holdableSlot, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
      actionProperties.incursDurabilityLoss[EquipmentSlotType.Holdable]
    )) {
      if (!(durabilityLossCondition === condition)) continue;
      durabilityChanges.updateOrCreateDurabilityChangeRecord(userId, {
        taggedSlot: { type: EquipmentSlotType.Holdable, slot: holdableSlot },
        value: BASE_DURABILITY_LOSS,
      });
    }
}
