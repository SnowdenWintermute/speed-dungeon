import { AnalysisSpecHolder } from "./analysis-spec-holder.ts";
import { AnalysisCombatantReport, RunReport } from "./analysis-run-reporter.ts";
import { AnalysisSampleDimensions } from "./analysis-sample.ts";
import { RoomAvailability } from "./room-availability.ts";

export interface AnalysisRunSetResult {
  runsFailed: number;
}

export interface AnalysisRunSet<TResult extends AnalysisRunSetResult> {
  executeSet(runCount: number, onRunFinished: (runsFinished: number) => void): void;
  result: TResult;
}

export interface AnalysisSampleRunSetResult<TSample> extends AnalysisRunSetResult {
  samples: TSample[];
  availability: RoomAvailability[];
}

export type AnalysisRunExecutor<TCombatantReport> = () => {
  report: RunReport<TCombatantReport>;
  analysisSpecsHolder: AnalysisSpecHolder;
};

export class AnalysisSampleCollectingRunSet<
  TCombatantReport extends AnalysisCombatantReport,
  TSample extends AnalysisSampleDimensions,
> implements AnalysisRunSet<AnalysisSampleRunSetResult<TSample>>
{
  private samples: TSample[] = [];
  private availability: RoomAvailability[] = [];
  private runsCollected = 0;
  private runsFailed = 0;

  constructor(
    private executeRun: AnalysisRunExecutor<TCombatantReport>,
    private toSample: (
      dimensions: AnalysisSampleDimensions,
      combatantReport: TCombatantReport
    ) => TSample
  ) {}

  get result(): AnalysisSampleRunSetResult<TSample> {
    return { samples: this.samples, availability: this.availability, runsFailed: this.runsFailed };
  }

  private collectRun(runReport: RunReport<TCombatantReport>, specHolder: AnalysisSpecHolder) {
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

        const dimensions: AnalysisSampleDimensions = {
          runIndex,
          floor,
          room,
          weaponSpecialty: characterBuildSpec.weaponSpecialty,
          mainClass: characterBuildSpec.mainClass,
          supportClass: characterBuildSpec.supportClass,
          mainClassLevel: combatantReport.mainClassLevel,
          supportClassLevel: combatantReport.supportClassLevel ?? null,
          totalAttributes: combatantReport.totalAttributes,
        };

        this.samples.push(this.toSample(dimensions, combatantReport));
      }
    }
  }

  executeSet(runCount: number, onRunFinished: (runsFinished: number) => void) {
    for (let i = 0; i < runCount; i += 1) {
      try {
        const { report, analysisSpecsHolder } = this.executeRun();
        this.collectRun(report, analysisSpecsHolder);
      } catch (probablyError) {
        this.runsFailed += 1;
        console.error(probablyError);
      }
      onRunFinished(i + 1);
    }
  }
}
