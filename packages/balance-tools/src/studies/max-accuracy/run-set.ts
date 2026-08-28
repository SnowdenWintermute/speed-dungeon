import { AllocationIntensity } from "@/analysis-runs/allocation-intensity";
import { AnalysisRunOptions } from "@/analysis-runs/analysis-run-options";
import { AnalysisSampleCollectingRunSet } from "@/analysis-runs/run-set";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { maxAccuracyAnalysisRun } from "./run";
import { MaxAccuracyCombatantReport } from "./run-reporter";
import { MaxAccuracySample } from "./samples";

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
