import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { analysisRun } from "../../analysis-runs/execute-analysis-run.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { MaxAgilityCombatantReport, MaxAgilityRunReporter } from "./run-reporter.ts";

export function maxAgilityAnalysisRun(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return analysisRun<MaxAgilityCombatantReport>(
    characterSpecs,
    (party) => new MaxAgilityRunReporter(party),
    allocationIntensity,
    options
  );
}
