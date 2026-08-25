import {
  AdventuringParty,
  AffixType,
  CombatantId,
  CombatantProperties,
  CombatAttribute,
  DEX_TO_ACCURACY_RATIO,
  Equipment,
  invariant,
} from "@speed-dungeon/common";
import { AnalysisRunReporter, RunReport } from "@/analysis-runs/analysis-run-reporter";
import {
  EquipmentBaseItemTally,
  TalliedBaseItem,
} from "@/analysis-subjects/equipment-base-item-tally";

/** every field is accuracy, including the ones dexterity supplies, so they read against each other */
export interface AccuracyBySource {
  fromAccuracyAffixOnGear: number;
  fromDexterityAffixOnGear: number;
  fromAllocated: number;
  fromInherent: number;
}

export interface MaxAccuracyCombatantReport {
  /**
   * Read from the combatant. The sources below attribute it and will not re-sum to it exactly:
   * getCombatantTotalAttributes derives accuracy from *total* dexterity and floors the result once,
   * where attributing per source floors each source separately.
   */
  totalAccuracy: number;
  accuracyBySource: AccuracyBySource;
  mainClassLevel: number;
  supportClassLevel: number | undefined;
}

export interface MaxAccuracyRoomReport {
  /** every base item dropped since the run began, not only this room's drops */
  cumulativeAvailableEquipment: TalliedBaseItem[];
  combatantReports: Map<CombatantId, MaxAccuracyCombatantReport>;
}

export class MaxAccuracyRunReporter implements AnalysisRunReporter<MaxAccuracyRoomReport> {
  private _runReport: RunReport<MaxAccuracyRoomReport> = [];
  private cumulativeAvailableEquipment = new EquipmentBaseItemTally();

  constructor(private party: AdventuringParty) {}

  get runReport() {
    return this._runReport;
  }

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

  private getCombatantReport(
    combatantProperties: CombatantProperties,
    totalAccuracy: number
  ): MaxAccuracyCombatantReport {
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

  updateReport(
    goalPerformanceByCharacter: Map<CombatantId, number>,
    equipmentDroppedThisRoom: Equipment[]
  ) {
    this.cumulativeAvailableEquipment.addAllEquipment(equipmentDroppedThisRoom);

    const roomReport = {
      cumulativeAvailableEquipment: this.cumulativeAvailableEquipment.entries(),
      combatantReports: new Map<CombatantId, MaxAccuracyCombatantReport>(),
    };

    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      const totalAccuracy = goalPerformanceByCharacter.get(combatant.getEntityId());
      invariant(totalAccuracy !== undefined);

      roomReport.combatantReports.set(
        combatant.getEntityId(),
        this.getCombatantReport(combatant.getCombatantProperties(), totalAccuracy)
      );
    }

    const { dungeonExplorationManager } = this.party;
    this._runReport.push({
      floor: dungeonExplorationManager.getCurrentFloor(),
      room: dungeonExplorationManager.getCurrentRoomNumber(),
      roomReport,
    });
  }
}
