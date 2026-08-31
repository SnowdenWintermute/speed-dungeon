import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { AnalysisSampleCollectingRunSet } from "../../analysis-runs/run-set.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { maxSpeedAnalysisRun } from "./run.ts";
import { MaxSpeedCombatantReport } from "./run-reporter.ts";
import { MaxSpeedSample } from "./samples.ts";

export function maxSpeedRunSet(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return new AnalysisSampleCollectingRunSet<MaxSpeedCombatantReport, MaxSpeedSample>(
    () => maxSpeedAnalysisRun(characterSpecs, allocationIntensity, options),
    (dimensions, combatantReport) => ({
      ...dimensions,
      agilityBySource: combatantReport.agilityBySource,
    })
  );
}
