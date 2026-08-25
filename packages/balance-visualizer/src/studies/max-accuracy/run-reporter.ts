import {
  AffixType,
  Combatant,
  CombatantProperties,
  CombatAttribute,
  DEX_TO_ACCURACY_RATIO,
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
  private getGearContributions(combatantProperties: CombatantProperties) {
    let dexterity = 0;
    let fromAccuracyAffix = 0;

    for (const equipment of combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    })) {
      dexterity += equipment.getAffixAttributeValue(AffixType.Dexterity, CombatAttribute.Dexterity);
      fromAccuracyAffix += equipment.getAffixAttributeValue(
        AffixType.Accuracy,
        CombatAttribute.Accuracy
      );
    }

    return { dexterity, fromAccuracyAffix };
  }

  protected getCombatantReport(
    combatant: Combatant,
    totalAccuracy: number
  ): MaxAccuracyCombatantReport {
    const combatantProperties = combatant.getCombatantProperties();
    const gear = this.getGearContributions(combatantProperties);
    const { attributeProperties, classProgressionProperties } = combatantProperties;
    const allocated = attributeProperties.getAllocatedAttributes();
    const inherent = attributeProperties.getInherentAttributes();

    return {
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
      mainClassLevel: classProgressionProperties.getMainClass().level,
      supportClassLevel: classProgressionProperties.getSupportClassOption()?.level,
    };
  }
}
