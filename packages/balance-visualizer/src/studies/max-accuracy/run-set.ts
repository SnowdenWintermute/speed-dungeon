import { NormalizedPercentage } from "@speed-dungeon/common";
import { AnalysisSampleCollectingRunSet } from "@/analysis-runs/run-set";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { maxAccuracyAnalysisRun } from "./run";
import { MaxAccuracyCombatantReport } from "./run-reporter";
import { MaxAccuracySample } from "./samples";

export function maxAccuracyRunSet(
  characterSpecs: AnalysisCharacterSpecification[],
  discretionaryShare: NormalizedPercentage
) {
  return new AnalysisSampleCollectingRunSet<MaxAccuracyCombatantReport, MaxAccuracySample>(
    () => maxAccuracyAnalysisRun(characterSpecs, discretionaryShare),
    (dimensions, combatantReport) => ({
      ...dimensions,
      totalAccuracy: combatantReport.totalAccuracy,
      accuracyBySource: combatantReport.accuracyBySource,
    })
  );
}
