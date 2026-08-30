import { Combatant, Equipment, EquipmentSlotId } from "@speed-dungeon/common";
import {
  AnalysisCombatantReport,
  RoomReportingRunReporter,
} from "../../analysis-runs/analysis-run-reporter.ts";

/** the three places armor class can be worn; everything else reports none of it */
export const ARMOR_CLASS_SLOT_IDS = [
  EquipmentSlotId.Head,
  EquipmentSlotId.Body,
  EquipmentSlotId.OffHand,
] as const;

export type ArmorClassSlotId = (typeof ARMOR_CLASS_SLOT_IDS)[number];

export function armorClassSlotRecord<T>(
  valueOf: (slotId: ArmorClassSlotId) => T
): Record<ArmorClassSlotId, T> {
  return {
    [EquipmentSlotId.Head]: valueOf(EquipmentSlotId.Head),
    [EquipmentSlotId.Body]: valueOf(EquipmentSlotId.Body),
    [EquipmentSlotId.OffHand]: valueOf(EquipmentSlotId.OffHand),
  };
}

export interface ArmorClassCombatantReport extends AnalysisCombatantReport {
  /** what the goal scored: armor class over everything worn */
  totalArmorClass: number;
  armorClassBySlot: Record<ArmorClassSlotId, number>;
  wornArmor: Record<ArmorClassSlotId, Equipment | null>;
}

export class ArmorClassRunReporter extends RoomReportingRunReporter<ArmorClassCombatantReport> {
  private wornArmor(combatant: Combatant) {
    const { equipment } = combatant.getCombatantProperties();
    return armorClassSlotRecord((slotId) => equipment.getEquipmentInSlot(slotId) ?? null);
  }

  /**
   * Read per item rather than through `Equipment.getAttributesOnEquipmentList`, which the total goes
   * through, because the split is per slot. The two agree at any intensity: the driver's scaling swap
   * leaves armor class alone, since armor class affixes are scaled where they are rolled instead.
   * Broken items are skipped for the same reason — the static skips them too.
   */
  private armorClassBySlot(wornArmor: Record<ArmorClassSlotId, Equipment | null>) {
    return armorClassSlotRecord((slotId) => {
      const worn = wornArmor[slotId];
      if (worn === null || worn.isBroken()) {
        return 0;
      }
      return worn.getModifiedArmorClass();
    });
  }

  protected getCombatantReport(
    combatant: Combatant,
    totalArmorClass: number
  ): ArmorClassCombatantReport {
    const wornArmor = this.wornArmor(combatant);

    return {
      // the attributes here are the copied profile, which carries no armor class of its own
      ...this.commonCombatantFields(combatant),
      totalArmorClass,
      armorClassBySlot: this.armorClassBySlot(wornArmor),
      wornArmor,
    };
  }
}
