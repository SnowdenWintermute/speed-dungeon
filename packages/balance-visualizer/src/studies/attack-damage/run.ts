import { CombatAttribute } from "@speed-dungeon/common";
import { AnalysisRun } from "@/analysis-runs";
import { AnalysisPartyBuilder } from "@/analysis-runs/analysis-party-builder";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { AttributeAllocationSolver } from "@/solvers/attribute-allocation";
import { BestImprovementEquipmentSolver } from "@/solvers/best-improvement";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "@/solvers/equipment-score-domination-axes";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "./goal-performance-checker";
import { AttackDamageRoomReport, AttackDamageRunReporter } from "./run-reporter";

export function attackDamageAnalysisRun(characterSpecs: AnalysisCharacterSpecification[]) {
  const { game, party, analysisSpecsHolder } = new AnalysisPartyBuilder().build(characterSpecs);

  const goalPerformanceChecker = new SampledDamageOnTargetDummyGoalPerformanceChecker();

  const runner = new AnalysisRun<AttackDamageRoomReport>(
    game,
    party,
    new BestImprovementEquipmentSolver(party, analysisSpecsHolder, goalPerformanceChecker, [
      EQUIPMENT_SCORE_DOMINATION_AXES.strength,
      EQUIPMENT_SCORE_DOMINATION_AXES.dexterity,
      EQUIPMENT_SCORE_DOMINATION_AXES.accuracy,
      EQUIPMENT_SCORE_DOMINATION_AXES.nonWeaponFlatDamage,
      EQUIPMENT_SCORE_DOMINATION_AXES.weaponDamageAverage,
    ]),
    new AttributeAllocationSolver(party, analysisSpecsHolder, goalPerformanceChecker, [
      CombatAttribute.Strength,
      CombatAttribute.Dexterity,
    ]),
    goalPerformanceChecker,
    new AttackDamageRunReporter(party)
  );

  const report = runner.simulateRun();
  return { report, analysisSpecsHolder };
}
