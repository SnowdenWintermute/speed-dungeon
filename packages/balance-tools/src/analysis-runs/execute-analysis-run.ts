import { AdventuringParty } from "@speed-dungeon/common";
import { AnalysisRun } from "./index.ts";
import { AllocationIntensity } from "./allocation-intensity.ts";
import { AnalysisRunOptions } from "./analysis-run-options.ts";
import { AnalysisPartyBuilder } from "./analysis-party-builder.ts";
import { AnalysisRunReporter } from "./analysis-run-reporter.ts";
import { AnalysisSubjects } from "./analysis-subjects.ts";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { AttributeAllocationSolver } from "../solvers/attribute-allocation.ts";
import { BestImprovementEquipmentSolver } from "../solvers/best-improvement.ts";
import { CopiedAttributeSolver } from "../solvers/copied-attribute-solver.ts";
import { constructGoalPerformanceChecker } from "../goal-performance-checkers/constructors.ts";

export function analysisRun<TCombatantReport>(
  characterSpecs: AnalysisCharacterSpecification[],
  createRunReporter: (
    party: AdventuringParty,
    analysisSubjects: AnalysisSubjects
  ) => AnalysisRunReporter<TCombatantReport>,
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  const { game, party, analysisSpecsByCombatantId } = new AnalysisPartyBuilder().build(
    characterSpecs
  );
  const analysisSubjects = new AnalysisSubjects(
    analysisSpecsByCombatantId,
    constructGoalPerformanceChecker,
    options.targetDummiesHaveArmorClass
  );

  const runner = new AnalysisRun<TCombatantReport>(
    game,
    party,
    new BestImprovementEquipmentSolver(party, analysisSubjects),
    [
      new AttributeAllocationSolver(party, analysisSubjects, allocationIntensity),
      new CopiedAttributeSolver(party, analysisSubjects),
    ],
    analysisSubjects.getComparisonRollScope(),
    createRunReporter(party, analysisSubjects),
    allocationIntensity,
    options
  );

  const report = runner.simulateRun();
  return { report, analysisSubjects };
}
