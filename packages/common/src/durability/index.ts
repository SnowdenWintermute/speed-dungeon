import { DurabilityLossCondition } from "../combat/combat-actions/combat-action-durability-loss-condition.js";
import { CombatActionComponent } from "../combat/combat-actions/index.js";
import {
  Combatant,
  CombatantEquipment,
  applyEquipmentEffectWhileMaintainingResourcePercentages,
} from "../combatants/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { HitOutcome } from "../hit-outcome.js";
import { Equipment, EquipmentSlotType, TaggedEquipmentSlot } from "../items/equipment/index.js";
import { EntityId } from "../primatives/index.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";

export interface EquipmentDurabilityChange {
  taggedSlot: TaggedEquipmentSlot;
  value: number;
}

export const BASE_DURABILITY_LOSS = -1;
export const HIT_OUTCOMES_THAT_CONTACT_TARGET = [
  HitOutcome.Parry,
  HitOutcome.Hit,
  HitOutcome.ShieldBlock,
  HitOutcome.Counterattack,
];

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

  isEmpty() {
    return Object.keys(this.records).length === 0;
  }

  static ApplyToGame(
    game: SpeedDungeonGame,
    durabilityChanges: DurabilityChangesByEntityId,
    onApply?: (combatant: Combatant, equipment: Equipment) => void
  ) {
    for (const [entityId, durabilitychanges] of Object.entries(durabilityChanges.records)) {
      const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
      if (combatantResult instanceof Error) return combatantResult;
      for (const change of durabilitychanges.changes) {
        const { taggedSlot, value } = change;
        const equipmentOption = CombatantEquipment.getEquipmentInSlot(
          combatantResult.combatantProperties,
          taggedSlot
        );

        // console.log(
        //   "checking dura: ",
        //   equipmentOption?.entityProperties.name,
        //   equipmentOption?.durability
        // );

        applyEquipmentEffectWhileMaintainingResourcePercentages(
          combatantResult.combatantProperties,
          () => {
            if (equipmentOption) Equipment.changeDurability(equipmentOption, value);
            if (onApply && equipmentOption) onApply(combatantResult, equipmentOption);
          }
        );
      }
    }
  }

  updateConditionalChangesOnUser(
    userId: EntityId,
    action: CombatActionComponent,
    condition: DurabilityLossCondition
  ) {
    // take dura from user's equipment if should
    if (action.incursDurabilityLoss === undefined) return;

    if (action.incursDurabilityLoss[EquipmentSlotType.Wearable]) {
      for (const [wearableSlot, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
        action.incursDurabilityLoss[EquipmentSlotType.Wearable]
      )) {
        if (!(durabilityLossCondition === condition)) continue;

        this.updateOrCreateDurabilityChangeRecord(userId, {
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
        this.updateOrCreateDurabilityChangeRecord(userId, {
          taggedSlot: { type: EquipmentSlotType.Holdable, slot: holdableSlot },
          value: BASE_DURABILITY_LOSS,
        });
      }
    }
  }

  updateEquipmentRecord(
    combatant: Combatant,
    taggedSlot: TaggedEquipmentSlot,
    extraDurabilityLoss: number = 0
  ) {
    const equipmentOption = CombatantEquipment.getEquipmentInSlot(
      combatant.combatantProperties,
      taggedSlot
    );

    if (equipmentOption) {
      this.updateOrCreateDurabilityChangeRecord(combatant.entityProperties.id, {
        taggedSlot,
        value: BASE_DURABILITY_LOSS + extraDurabilityLoss,
      });
    }
  }
}
