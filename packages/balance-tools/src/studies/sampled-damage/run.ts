import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { analysisRun } from "../../analysis-runs/analysis-run-factory.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { SampledDamageCombatantReport, SampledDamageRunReporter } from "./run-reporter.ts";

export function sampledDamageAnalysisRun(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return analysisRun<SampledDamageCombatantReport>(
    characterSpecs,
    (party, analysisSpecContext) => new SampledDamageRunReporter(party, analysisSpecContext),
    allocationIntensity,
    options
  );
}
