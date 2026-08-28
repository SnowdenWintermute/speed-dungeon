import {
  Combatant,
  CombatantProperties,
  CombatAttribute,
  DEX_TO_ACCURACY_RATIO,
  Equipment,
} from "@speed-dungeon/common";
import {
  AnalysisCombatantReport,
  RoomReportingRunReporter,
} from "@/analysis-runs/analysis-run-reporter";

/** every field is accuracy, including the ones dexterity supplies, so they read against each other */
export interface AccuracyBySource {
  fromAccuracyAffixOnGear: number;
  fromDexterityAffixOnGear: number;
  fromAllocated: number;
  fromInherent: number;
}

export interface MaxAccuracyCombatantReport extends AnalysisCombatantReport {
  /**
   * Read from the combatant. The sources below attribute it and will not re-sum to it exactly:
   * getCombatantTotalAttributes derives accuracy from *total* dexterity and floors the result once,
   * where attributing per source floors each source separately.
   */
  totalAccuracy: number;
  accuracyBySource: AccuracyBySource;
}

export class MaxAccuracyRunReporter extends RoomReportingRunReporter<MaxAccuracyCombatantReport> {
  /**
   * Read through `Equipment.getAttributesOnEquipmentList`, which is what the combatant's own total
   * reads through, so the two agree. Summing affix values per item instead would not: the analysis
   * driver swaps that static for one scaling every attribute by the allocation intensity, so at
   * anything under 100% a per-item read reports gear the character never actually received.
   */
  private getGearContributions(combatantProperties: CombatantProperties) {
    const fromEquipment = Equipment.getAttributesOnEquipmentList([
      ...combatantProperties.equipment.getAllEquippedItems({ includeUnselectedHotswapSlots: false }),
    ]);

    return {
      dexterity: fromEquipment[CombatAttribute.Dexterity],
      fromAccuracyAffix: fromEquipment[CombatAttribute.Accuracy],
    };
  }

  protected getCombatantReport(
    combatant: Combatant,
    totalAccuracy: number
  ): MaxAccuracyCombatantReport {
    const combatantProperties = combatant.getCombatantProperties();
    const gear = this.getGearContributions(combatantProperties);
    const { attributeProperties } = combatantProperties;
    const allocated = attributeProperties.getAllocatedAttributes();
    const inherent = attributeProperties.getInherentAttributes();

    return {
      ...this.commonCombatantFields(combatant),
      totalAccuracy,
      accuracyBySource: {
        fromAccuracyAffixOnGear: gear.fromAccuracyAffix,
        fromDexterityAffixOnGear: gear.dexterity * DEX_TO_ACCURACY_RATIO,
        // accuracy itself is not point assignable, so every allocated point of it comes via dexterity
        fromAllocated: allocated[CombatAttribute.Dexterity] * DEX_TO_ACCURACY_RATIO,
        fromInherent:
          inherent[CombatAttribute.Accuracy] +
          inherent[CombatAttribute.Dexterity] * DEX_TO_ACCURACY_RATIO,
      },
    };
  }
}
