import {
  DURABILITY_LOSS_CONDITION_STRINGS,
  DurabilityLossCondition,
} from "../combat/combat-actions/combat-action-durability-loss-condition.js";
import { CombatActionComponent } from "../combat/combat-actions/index.js";
import { IActionUser } from "../combatant-context/action-user.js";
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
    actionUser: IActionUser,
    durabilityChange: EquipmentDurabilityChange
  ) {
    const userEquipment = actionUser.getEquipmentOption();
    if (userEquipment === null) throw new Error("Expected action user to have equipment");

    const equipment = CombatantEquipment.getEquipmentInSlot(
      userEquipment,
      durabilityChange.taggedSlot
    );

    if (durabilityChange.value < 0 && equipment?.durability?.current === 0) return;

    let existingChanges = this.records[actionUser.getEntityId()];
    if (!existingChanges)
      existingChanges = this.records[actionUser.getEntityId()] = new DurabilityChanges();
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
          combatantResult.combatantProperties.equipment,
          taggedSlot
        );

        applyEquipmentEffectWhileMaintainingResourcePercentages(
          combatantResult.combatantProperties,
          () => {
            if (equipmentOption !== undefined) Equipment.changeDurability(equipmentOption, value);
            if (onApply && equipmentOption) onApply(combatantResult, equipmentOption);
          }
        );
      }
    }
  }

  updateConditionalChangesOnUser(
    user: IActionUser,
    action: CombatActionComponent,
    condition: DurabilityLossCondition
  ) {
    const { incursDurabilityLoss } = action.costProperties;
    // take dura from user's equipment if should
    if (incursDurabilityLoss === undefined) return;
    const equipmentOption = user.getEquipmentOption();
    if (!equipmentOption) return;

    if (incursDurabilityLoss[EquipmentSlotType.Wearable]) {
      for (const [wearableSlot, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
        incursDurabilityLoss[EquipmentSlotType.Wearable]
      )) {
        if (!(durabilityLossCondition === condition)) continue;

        const taggedSlot: TaggedEquipmentSlot = {
          type: EquipmentSlotType.Wearable,
          slot: wearableSlot,
        };

        const equipment = CombatantEquipment.getEquipmentInSlot(equipmentOption, taggedSlot);
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
        const equipment = CombatantEquipment.getEquipmentInSlot(equipmentOption, taggedSlot);
        if (equipment === undefined) continue;
        if (equipment.durability?.current === 0) continue;

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
      combatant.combatantProperties.equipment,
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
