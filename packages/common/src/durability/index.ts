import { DurabilityLossCondition } from "../combat/combat-actions/combat-action-durability-loss-condition.js";
import { CombatActionComponent } from "../combat/combat-actions/index.js";
import { IActionUser } from "../action-user-context/action-user.js";
import { Combatant } from "../combatants/index.js";
import { HitOutcome } from "../hit-outcome.js";
import { Equipment } from "../items/equipment/index.js";
import { EntityId } from "../aliases.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { EquipmentSlotId } from "../combatants/combatant-equipment/types.js";

export interface EquipmentDurabilityChange {
  slotId: EquipmentSlotId;
  value: number;
}

export const BASE_DURABILITY_LOSS = -1;
export const HIT_OUTCOMES_THAT_CONTACT_TARGET = [
  HitOutcome.Parry,
  HitOutcome.Hit,
  // HitOutcome.ShieldBlock, since a hit flag will already be registered, we don't need to charge them twice
  HitOutcome.Counterattack,
];

export class DurabilityChanges {
  changes: EquipmentDurabilityChange[] = [];

  addOrUpdateEquipmentDurabilityChange(durabilityChange: EquipmentDurabilityChange) {
    const { slotId, value } = durabilityChange;

    const existingRecord = this.changes.find((change) => change.slotId === slotId);
    if (existingRecord) {
      existingRecord.value += value;
    } else {
      this.changes.push(durabilityChange);
    }
  }
}

export class DurabilityChangesByEntityId {
  records: Record<EntityId, DurabilityChanges> = {};

  updateOrCreateDurabilityChangeRecord(
    actionUser: IActionUser,
    durabilityChange: EquipmentDurabilityChange
  ) {
    const userEquipment = actionUser.getEquipmentOption();
    if (userEquipment === null) {
      throw new Error("Expected action user to have equipment");
    }

    const equipment = userEquipment.getEquipmentInSlot(durabilityChange.slotId);

    if (durabilityChange.value < 0 && equipment?.durability?.current === 0) {
      return;
    }

    let existingChanges = this.records[actionUser.getEntityId()];
    if (!existingChanges) {
      existingChanges = this.records[actionUser.getEntityId()] = new DurabilityChanges();
    }
    existingChanges.addOrUpdateEquipmentDurabilityChange(durabilityChange);
  }

  isEmpty() {
    return Object.keys(this.records).length === 0;
  }

  static ApplyToGame(
    party: AdventuringParty,
    durabilityChanges: DurabilityChangesByEntityId,
    onApply?: (combatant: Combatant, equipment: Equipment) => void
  ) {
    for (const [entityId, durabilitychanges] of Object.entries(durabilityChanges.records)) {
      const combatant = party.combatantManager.getExpectedCombatant(entityId);

      for (const change of durabilitychanges.changes) {
        const { slotId, value } = change;
        const { equipment } = combatant.combatantProperties;
        const equipmentOption = equipment.getEquipmentInSlot(slotId);

        combatant.combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
          if (equipmentOption !== null) {
            equipmentOption.changeDurability(value);
          }
          if (onApply && equipmentOption) {
            onApply(combatant, equipmentOption);
          }
        });
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
    const equipmentOption = user.getEquipmentOption();
    if (!equipmentOption) {
      return;
    }

    for (const [slotId, durabilityLossCondition] of iterateNumericEnumKeyedRecord(
      incursDurabilityLoss
    )) {
      if (!(durabilityLossCondition === condition)) {
        continue;
      }

      const equipment = equipmentOption.getEquipmentInSlot(slotId);
      if (equipment?.durability?.current === 0) {
        continue;
      }

      this.updateOrCreateDurabilityChangeRecord(user, {
        slotId,
        value: BASE_DURABILITY_LOSS,
      });
    }
  }

  updateEquipmentRecord(
    combatant: Combatant,
    slotId: EquipmentSlotId,
    extraDurabilityLoss: number = 0
  ) {
    const { equipment } = combatant.combatantProperties;
    const equipmentOption = equipment.getEquipmentInSlot(slotId);

    if (equipmentOption) {
      this.updateOrCreateDurabilityChangeRecord(combatant, {
        slotId,
        value: BASE_DURABILITY_LOSS + extraDurabilityLoss,
      });
    }
  }
}
