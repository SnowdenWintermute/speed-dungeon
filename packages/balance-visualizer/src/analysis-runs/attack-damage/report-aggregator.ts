import { EquipmentSlotId } from "@speed-dungeon/common";
import { attackDamageAnalysisRun } from ".";
import { AttackDamageRoomReport, RunReport } from "../analysis-run-reporter";
import { AnalysisSpecHolder } from "../analysis-spec-holder";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { AttackDamageSample } from "./samples";

export class AttackDamageRunSet {
  private _samples: AttackDamageSample[] = [];
  private runsCollected = 0;

  constructor(private characterSpecs: AnalysisCharacterSpecification[]) {}

  get samples(): readonly AttackDamageSample[] {
    return this._samples;
  }

  /**
   * Flattens as each run finishes so the RunReport, which holds live Equipment, can be dropped
   * instead of retained across the whole set.
   */
  private collectRun(runReport: RunReport<AttackDamageRoomReport>, specHolder: AnalysisSpecHolder) {
    const runIndex = this.runsCollected;
    this.runsCollected += 1;

    for (const { floor, room, roomReport } of runReport) {
      const { combatantReports, cumulativeAvailableEquipment } = roomReport;

      for (const [combatantId, combatantReport] of combatantReports) {
        const { characterBuildSpec } = specHolder.requireSpec(combatantId);
        const { heldEquipment } = combatantReport;

        this._samples.push({
          runIndex,
          floor,
          room,
          weaponSpecialty: characterBuildSpec.weaponSpecialty,
          mainClass: characterBuildSpec.mainClass,
          supportClass: characterBuildSpec.supportClass,
          mainClassLevel: combatantReport.mainClassLevel,
          supportClassLevel: combatantReport.supportClassLevel ?? null,
          sampledDamageOnDummy: combatantReport.sampledDamageOnDummy,
          tooltipDamage: combatantReport.tooltipDamage,
          wornHoldables: {
            [EquipmentSlotId.MainHand]:
              heldEquipment[EquipmentSlotId.MainHand]?.equipmentBaseItemProperties ?? null,
            [EquipmentSlotId.OffHand]:
              heldEquipment[EquipmentSlotId.OffHand]?.equipmentBaseItemProperties ?? null,
          },
          contributingAllocations: combatantReport.contributingAllocations,
          availableEquipment: cumulativeAvailableEquipment,
        });
      }
    }
  }

  executeSet(runCount: number) {
    for (let i = 0; i < runCount; i += 1) {
      try {
        const { report, analysisSpecsHolder } = attackDamageAnalysisRun(this.characterSpecs);
        this.collectRun(report, analysisSpecsHolder);
      } catch (probablyError) {
        console.error(probablyError);
      }
    }
  }
}
