import { AllocationIntensity } from "@/analysis-runs/allocation-intensity";
import { AnalysisSampleCollectingRunSet } from "@/analysis-runs/run-set";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { maxAccuracyAnalysisRun } from "./run";
import { MaxAccuracyCombatantReport } from "./run-reporter";
import { MaxAccuracySample } from "./samples";

export function maxAccuracyRunSet(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity
) {
  return new AnalysisSampleCollectingRunSet<MaxAccuracyCombatantReport, MaxAccuracySample>(
    () => maxAccuracyAnalysisRun(characterSpecs, allocationIntensity),
    (dimensions, combatantReport) => ({
      ...dimensions,
      totalAccuracy: combatantReport.totalAccuracy,
      accuracyBySource: combatantReport.accuracyBySource,
    })
  );
}
