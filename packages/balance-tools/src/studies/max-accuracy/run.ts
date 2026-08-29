import { CombatAttribute } from "@speed-dungeon/common";
import { AnalysisRun } from "../../analysis-runs/index.ts";
import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { AnalysisPartyBuilder } from "../../analysis-runs/analysis-party-builder.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { AttributeAllocationSolver } from "../../solvers/attribute-allocation.ts";
import { BestImprovementEquipmentSolver } from "../../solvers/best-improvement.ts";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "../../solvers/equipment-score-domination-axes.ts";
import { TotalAccuracyGoalPerformanceChecker } from "./goal-performance-checker.ts";
import { MaxAccuracyCombatantReport, MaxAccuracyRunReporter } from "./run-reporter.ts";

export function maxAccuracyAnalysisRun(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  const { game, party, analysisSpecsHolder } = new AnalysisPartyBuilder().build(characterSpecs);

  const goalPerformanceChecker = new TotalAccuracyGoalPerformanceChecker();

  const runner = new AnalysisRun<MaxAccuracyCombatantReport>(
    game,
    party,
    // an item carrying neither affix is pruned as scoring on no axis, which is what we want: it
    // supplies no accuracy, so it says nothing about how much was available
    new BestImprovementEquipmentSolver(party, analysisSpecsHolder, goalPerformanceChecker, [
      EQUIPMENT_SCORE_DOMINATION_AXES.dexterity,
      EQUIPMENT_SCORE_DOMINATION_AXES.accuracy,
    ]),
    // accuracy is not point assignable, so dexterity is the only allocation that moves it
    new AttributeAllocationSolver(
      party,
      analysisSpecsHolder,
      goalPerformanceChecker,
      [CombatAttribute.Dexterity],
      allocationIntensity
    ),
    goalPerformanceChecker,
    new MaxAccuracyRunReporter(party),
    allocationIntensity,
    options
  );

  const report = runner.simulateRun();
  return { report, analysisSpecsHolder };
}
