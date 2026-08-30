import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { analysisRun } from "../../analysis-runs/execute-analysis-run.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { MaxAccuracyCombatantReport, MaxAccuracyRunReporter } from "./run-reporter.ts";

export function maxAccuracyAnalysisRun(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return analysisRun<MaxAccuracyCombatantReport>(
    characterSpecs,
    (party) => new MaxAccuracyRunReporter(party),
    allocationIntensity,
    options
  );
}
