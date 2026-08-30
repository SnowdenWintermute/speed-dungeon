import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { analysisRun } from "../../analysis-runs/execute-analysis-run.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { ArmorClassCombatantReport, ArmorClassRunReporter } from "./run-reporter.ts";

export function armorClassAnalysisRun(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return analysisRun<ArmorClassCombatantReport>(
    characterSpecs,
    (party) => new ArmorClassRunReporter(party),
    allocationIntensity,
    options
  );
}
