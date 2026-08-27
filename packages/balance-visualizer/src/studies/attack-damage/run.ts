import { CombatAttribute } from "@speed-dungeon/common";
import { AnalysisRun } from "@/analysis-runs";
import { AllocationIntensity } from "@/analysis-runs/allocation-intensity";
import { AnalysisPartyBuilder } from "@/analysis-runs/analysis-party-builder";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { AttributeAllocationSolver } from "@/solvers/attribute-allocation";
import { BestImprovementEquipmentSolver } from "@/solvers/best-improvement";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "@/solvers/equipment-score-domination-axes";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "./goal-performance-checker";
import { AttackDamageCombatantReport, AttackDamageRunReporter } from "./run-reporter";

export function attackDamageAnalysisRun(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity
) {
  const { game, party, analysisSpecsHolder } = new AnalysisPartyBuilder().build(characterSpecs);

  const goalPerformanceChecker = new SampledDamageOnTargetDummyGoalPerformanceChecker();

  const runner = new AnalysisRun<AttackDamageCombatantReport>(
    game,
    party,
    new BestImprovementEquipmentSolver(party, analysisSpecsHolder, goalPerformanceChecker, [
      EQUIPMENT_SCORE_DOMINATION_AXES.strength,
      EQUIPMENT_SCORE_DOMINATION_AXES.dexterity,
      EQUIPMENT_SCORE_DOMINATION_AXES.accuracy,
      EQUIPMENT_SCORE_DOMINATION_AXES.nonWeaponFlatDamage,
      EQUIPMENT_SCORE_DOMINATION_AXES.weaponDamageAverage,
    ]),
    new AttributeAllocationSolver(
      party,
      analysisSpecsHolder,
      goalPerformanceChecker,
      [CombatAttribute.Strength, CombatAttribute.Dexterity],
      allocationIntensity
    ),
    goalPerformanceChecker,
    new AttackDamageRunReporter(party, goalPerformanceChecker),
    allocationIntensity
  );

  const report = runner.simulateRun();
  return { report, analysisSpecsHolder };
}
