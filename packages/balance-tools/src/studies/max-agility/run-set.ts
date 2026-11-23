import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { AnalysisSampleCollectingRunSet } from "../../analysis-runs/run-set.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { maxAgilityAnalysisRun } from "./run.ts";
import { MaxAgilityCombatantReport } from "./run-reporter.ts";
import { MaxAgilitySample } from "./samples.ts";

export function maxAgilityRunSet(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return new AnalysisSampleCollectingRunSet<MaxAgilityCombatantReport, MaxAgilitySample>(
    () => maxAgilityAnalysisRun(characterSpecs, allocationIntensity, options),
    (dimensions, combatantReport) => ({
      ...dimensions,
      agilityBySource: combatantReport.agilityBySource,
    })
  );
}
