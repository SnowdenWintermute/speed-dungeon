import { RunReport } from "@/analysis-runs/analysis-run-reporter";
import { AnalysisSpecHolder } from "@/analysis-runs/analysis-spec-holder";
import { RoomAvailability } from "@/analysis-runs/room-availability";
import { AnalysisRunSet } from "@/analysis-runs/run-set";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { maxAccuracyAnalysisRun } from "./run";
import { MaxAccuracyRoomReport } from "./run-reporter";
import { MaxAccuracyRunSetResult, MaxAccuracySample } from "./samples";

export class MaxAccuracyRunSet implements AnalysisRunSet<MaxAccuracyRunSetResult> {
  private samples: MaxAccuracySample[] = [];
  private availability: RoomAvailability[] = [];
  private runsCollected = 0;
  private runsFailed = 0;

  constructor(private characterSpecs: AnalysisCharacterSpecification[]) {}

  get result(): MaxAccuracyRunSetResult {
    return { samples: this.samples, availability: this.availability, runsFailed: this.runsFailed };
  }

  /**
   * Flattens as each run finishes so the RunReport, which holds live Equipment, can be dropped
   * instead of retained across the whole set.
   */
  private collectRun(runReport: RunReport<MaxAccuracyRoomReport>, specHolder: AnalysisSpecHolder) {
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

        this.samples.push({
          runIndex,
          floor,
          room,
          weaponSpecialty: characterBuildSpec.weaponSpecialty,
          mainClass: characterBuildSpec.mainClass,
          supportClass: characterBuildSpec.supportClass,
          mainClassLevel: combatantReport.mainClassLevel,
          supportClassLevel: combatantReport.supportClassLevel ?? null,
          totalAccuracy: combatantReport.totalAccuracy,
          accuracyBySource: combatantReport.accuracyBySource,
        });
      }
    }
  }

  executeSet(runCount: number, onRunFinished: (runsFinished: number) => void) {
    for (let i = 0; i < runCount; i += 1) {
      try {
        const { report, analysisSpecsHolder } = maxAccuracyAnalysisRun(this.characterSpecs);
        this.collectRun(report, analysisSpecsHolder);
      } catch (probablyError) {
        this.runsFailed += 1;
        console.error(probablyError);
      }
      onRunFinished(i + 1);
    }
  }
}
