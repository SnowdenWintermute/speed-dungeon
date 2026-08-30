import { Combatant, Equipment } from "@speed-dungeon/common";
import {
  AnalysisCombatantReport,
  RoomReportingRunReporter,
} from "../../analysis-runs/analysis-run-reporter.ts";
import { ArmorClassSlotId, armorClassSlotRecord } from "./slots.ts";

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

  /** per item rather than through `Equipment.getAttributesOnEquipmentList`, which the total goes
   * through; the two agree at any intensity because the driver's scaling swap leaves armor class
   * alone and both skip broken items */
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
      ...this.commonCombatantFields(combatant),
      totalArmorClass,
      armorClassBySlot: this.armorClassBySlot(wornArmor),
      wornArmor,
    };
  }
}
