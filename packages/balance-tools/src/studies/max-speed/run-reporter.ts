import { Combatant, CombatantProperties, CombatAttribute, Equipment } from "@speed-dungeon/common";
import {
  AnalysisCombatantReport,
  RoomReportingRunReporter,
} from "../../analysis-runs/analysis-run-reporter.ts";

export interface AgilityBySource {
  fromGear: number;
  allocated: number;
  inherent: number;
}

export interface MaxSpeedCombatantReport extends AnalysisCombatantReport {
  /**
   * The speed the agility bought is on `totalAttributes` already, read off the combatant. These
   * three attribute it and will not re-sum to it exactly: the total is floored once at the end,
   * where attributing per source floors each source separately.
   */
  agilityBySource: AgilityBySource;
}

export class MaxSpeedRunReporter extends RoomReportingRunReporter<MaxSpeedCombatantReport> {
  /**
   * Read through `Equipment.getAttributesOnEquipmentList`, which is what the combatant's own total
   * reads through, so the two agree. Summing affix values per item instead would not: the analysis
   * driver swaps that static for one scaling every attribute by the allocation intensity, so at
   * anything under 100% a per-item read reports gear the character never actually received.
   */
  private getAgilityFromGear(combatantProperties: CombatantProperties) {
    const fromEquipment = Equipment.getAttributesOnEquipmentList([
      ...combatantProperties.equipment.getAllEquippedItems({ includeUnselectedHotswapSlots: false }),
    ]);

    return fromEquipment[CombatAttribute.Agility];
  }

  protected getCombatantReport(combatant: Combatant): MaxSpeedCombatantReport {
    const combatantProperties = combatant.getCombatantProperties();
    const { attributeProperties } = combatantProperties;

    return {
      ...this.commonCombatantFields(combatant),
      agilityBySource: {
        fromGear: this.getAgilityFromGear(combatantProperties),
        allocated: attributeProperties.getAllocatedAttributes()[CombatAttribute.Agility],
        inherent: attributeProperties.getInherentAttributes()[CombatAttribute.Agility],
      },
    };
  }
}
