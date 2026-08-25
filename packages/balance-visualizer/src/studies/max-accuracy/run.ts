import { CombatAttribute } from "@speed-dungeon/common";
import { AnalysisRun } from "@/analysis-runs";
import { AnalysisPartyBuilder } from "@/analysis-runs/analysis-party-builder";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { AttributeAllocationSolver } from "@/solvers/attribute-allocation";
import { BestImprovementEquipmentSolver } from "@/solvers/best-improvement";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "@/solvers/equipment-score-domination-axes";
import { TotalAccuracyGoalPerformanceChecker } from "./goal-performance-checker";
import { MaxAccuracyRoomReport, MaxAccuracyRunReporter } from "./run-reporter";

export function maxAccuracyAnalysisRun(characterSpecs: AnalysisCharacterSpecification[]) {
  const { game, party, analysisSpecsHolder } = new AnalysisPartyBuilder().build(characterSpecs);

  const goalPerformanceChecker = new TotalAccuracyGoalPerformanceChecker();

  const runner = new AnalysisRun<MaxAccuracyRoomReport>(
    game,
    party,
    // an item carrying neither affix is pruned as scoring on no axis, which is what we want: it
    // supplies no accuracy, so it says nothing about how much was available
    new BestImprovementEquipmentSolver(party, analysisSpecsHolder, goalPerformanceChecker, [
      EQUIPMENT_SCORE_DOMINATION_AXES.dexterity,
      EQUIPMENT_SCORE_DOMINATION_AXES.accuracy,
    ]),
    // accuracy is not point assignable, so dexterity is the only allocation that moves it
    new AttributeAllocationSolver(party, analysisSpecsHolder, goalPerformanceChecker, [
      CombatAttribute.Dexterity,
    ]),
    goalPerformanceChecker,
    new MaxAccuracyRunReporter(party)
  );

  const report = runner.simulateRun();
  return { report, analysisSpecsHolder };
}
