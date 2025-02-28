import {
  CombatantEquipment,
  applyEquipmentEffectWhileMaintainingResourcePercentages,
} from "../combatants/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Equipment, TaggedEquipmentSlot } from "../items/equipment/index.js";
import { EntityId } from "../primatives/index.js";

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

  isEmpty() {
    return Object.keys(this.records).length === 0;
  }

  static ApplyToGame(game: SpeedDungeonGame, durabilityChanges: DurabilityChangesByEntityId) {
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
          }
        );
      }
    }
  }
}
