import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { analysisRun } from "../../analysis-runs/execute-analysis-run.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { MaxSpeedCombatantReport, MaxSpeedRunReporter } from "./run-reporter.ts";

export function maxSpeedAnalysisRun(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return analysisRun<MaxSpeedCombatantReport>(
    characterSpecs,
    (party) => new MaxSpeedRunReporter(party),
    allocationIntensity,
    options
  );
}
