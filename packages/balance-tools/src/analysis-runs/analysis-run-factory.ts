import { AdventuringParty } from "@speed-dungeon/common";
import { AnalysisRun } from "./index.ts";
import { AllocationIntensity } from "./allocation-intensity.ts";
import { AnalysisRunOptions } from "./analysis-run-options.ts";
import { AnalysisPartyBuilder } from "./analysis-party-builder.ts";
import { AnalysisRunReporter } from "./analysis-run-reporter.ts";
import { AnalysisSpecContext } from "./analysis-spec-context.ts";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { AttributeAllocationSolver } from "../solvers/attribute-allocation.ts";
import { BestImprovementEquipmentSolver } from "../solvers/best-improvement.ts";
import { constructGoalPerformanceChecker } from "../goal-performance-checkers/constructors.ts";

/**
 * Every study walks the dungeon the same way. What each character is solving for rides on its
 * specification, so the reporter — the table the study is here to produce — is all that is left to
 * vary.
 */
export function analysisRun<TCombatantReport>(
  characterSpecs: AnalysisCharacterSpecification[],
  createRunReporter: (
    party: AdventuringParty,
    analysisSpecContext: AnalysisSpecContext
  ) => AnalysisRunReporter<TCombatantReport>,
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  const { game, party, analysisSpecContext } = new AnalysisPartyBuilder().build(
    characterSpecs,
    constructGoalPerformanceChecker
  );

  const runner = new AnalysisRun<TCombatantReport>(
    game,
    party,
    new BestImprovementEquipmentSolver(party, analysisSpecContext),
    new AttributeAllocationSolver(party, analysisSpecContext, allocationIntensity),
    analysisSpecContext.getScopeProvider(),
    createRunReporter(party, analysisSpecContext),
    allocationIntensity,
    options
  );

  const report = runner.simulateRun();
  return { report, analysisSpecContext };
}
