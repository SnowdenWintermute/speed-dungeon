import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { AnalysisSampleCollectingRunSet } from "../../analysis-runs/run-set.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { maxAccuracyAnalysisRun } from "./run.ts";
import { MaxAccuracyCombatantReport } from "./run-reporter.ts";
import { MaxAccuracySample } from "./samples.ts";

export function maxAccuracyRunSet(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return new AnalysisSampleCollectingRunSet<MaxAccuracyCombatantReport, MaxAccuracySample>(
    () => maxAccuracyAnalysisRun(characterSpecs, allocationIntensity, options),
    (dimensions, combatantReport) => ({
      ...dimensions,
      totalAccuracy: combatantReport.totalAccuracy,
      accuracyBySource: combatantReport.accuracyBySource,
    })
  );
}
