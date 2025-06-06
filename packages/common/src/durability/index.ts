import {
  DURABILITY_LOSS_CONDITION_STRINGS,
  DurabilityLossCondition,
} from "../combat/combat-actions/combat-action-durability-loss-condition.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
} from "../combat/combat-actions/index.js";
import {
  Combatant,
  CombatantEquipment,
  CombatantProperties,
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
    combatant: Combatant,
    durabilityChange: EquipmentDurabilityChange
  ) {
    const entityId = combatant.entityProperties.id;

    const equipment = CombatantEquipment.getEquipmentInSlot(
      combatant.combatantProperties,
      durabilityChange.taggedSlot
    );
    if (durabilityChange.value < 0 && equipment?.durability?.current === 0) return;

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
    user: Combatant,
    action: CombatActionComponent,
    condition: DurabilityLossCondition
  ) {
    const { incursDurabilityLoss } = action.costProperties;
    // take dura from user's equipment if should
    if (incursDurabilityLoss === undefined) return;

    if (incursDurabilityLoss[EquipmentSlotType.Wearable]) {
      for (const [wearableSlot, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
        incursDurabilityLoss[EquipmentSlotType.Wearable]
      )) {
        if (!(durabilityLossCondition === condition)) continue;

        const taggedSlot: TaggedEquipmentSlot = {
          type: EquipmentSlotType.Wearable,
          slot: wearableSlot,
        };
        const equipment = CombatantEquipment.getEquipmentInSlot(
          user.combatantProperties,
          taggedSlot
        );
        if (equipment?.durability?.current === 0) continue;

        this.updateOrCreateDurabilityChangeRecord(user, {
          taggedSlot,
          value: BASE_DURABILITY_LOSS,
        });
      }
    }

    if (incursDurabilityLoss[EquipmentSlotType.Holdable]) {
      for (const [holdableSlot, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
        incursDurabilityLoss[EquipmentSlotType.Holdable]
      )) {
        if (!(durabilityLossCondition === condition)) continue;

        const taggedSlot: TaggedEquipmentSlot = {
          type: EquipmentSlotType.Holdable,
          slot: holdableSlot,
        };
        const equipment = CombatantEquipment.getEquipmentInSlot(
          user.combatantProperties,
          taggedSlot
        );
        if (equipment?.durability?.current === 0) continue;

        this.updateOrCreateDurabilityChangeRecord(user, {
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
      this.updateOrCreateDurabilityChangeRecord(combatant, {
        taggedSlot,
        value: BASE_DURABILITY_LOSS + extraDurabilityLoss,
      });
    }
  }
}
