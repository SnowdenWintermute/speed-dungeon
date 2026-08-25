import { EquipmentSlotId } from "@speed-dungeon/common";
import { attackDamageAnalysisRun } from ".";
import {
  AttackDamageRoomReport,
  CombatantReportTooltipDamage,
  RunReport,
} from "../analysis-run-reporter";
import { AnalysisSpecHolder } from "../analysis-spec-holder";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import {
  AttackDamageRunSetResult,
  AttackDamageSample,
  RoomAvailability,
  SampleTooltipDamage,
} from "./samples";

function toSampleTooltipDamage(tooltipDamage: CombatantReportTooltipDamage): SampleTooltipDamage {
  const offHand = tooltipDamage[EquipmentSlotId.OffHand];
  return {
    [EquipmentSlotId.MainHand]: tooltipDamage[EquipmentSlotId.MainHand].toSerialized(),
    [EquipmentSlotId.OffHand]: offHand === null ? null : offHand.toSerialized(),
  };
}

export class AttackDamageRunSet {
  private samples: AttackDamageSample[] = [];
  private availability: RoomAvailability[] = [];
  private runsCollected = 0;
  private runsFailed = 0;

  constructor(private characterSpecs: AnalysisCharacterSpecification[]) {}

  get result(): AttackDamageRunSetResult {
    return { samples: this.samples, availability: this.availability, runsFailed: this.runsFailed };
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

      this.availability.push({
        runIndex,
        floor,
        room,
        availableEquipment: cumulativeAvailableEquipment,
      });

      for (const [combatantId, combatantReport] of combatantReports) {
        const { characterBuildSpec } = specHolder.requireSpec(combatantId);
        const { heldEquipment } = combatantReport;

        this.samples.push({
          runIndex,
          floor,
          room,
          weaponSpecialty: characterBuildSpec.weaponSpecialty,
          mainClass: characterBuildSpec.mainClass,
          supportClass: characterBuildSpec.supportClass,
          mainClassLevel: combatantReport.mainClassLevel,
          supportClassLevel: combatantReport.supportClassLevel ?? null,
          sampledDamageOnDummy: combatantReport.sampledDamageOnDummy,
          tooltipDamage: toSampleTooltipDamage(combatantReport.tooltipDamage),
          wornHoldables: {
            [EquipmentSlotId.MainHand]:
              heldEquipment[EquipmentSlotId.MainHand]?.equipmentBaseItemProperties ?? null,
            [EquipmentSlotId.OffHand]:
              heldEquipment[EquipmentSlotId.OffHand]?.equipmentBaseItemProperties ?? null,
          },
          contributingAttributes: combatantReport.contributingAttributes,
        });
      }
    }
  }

  executeSet(runCount: number, onRunFinished: (runsFinished: number) => void) {
    for (let i = 0; i < runCount; i += 1) {
      try {
        const { report, analysisSpecsHolder } = attackDamageAnalysisRun(this.characterSpecs);
        this.collectRun(report, analysisSpecsHolder);
      } catch (probablyError) {
        this.runsFailed += 1;
        console.error(probablyError);
      }
      onRunFinished(i + 1);
    }
  }
}
