import { CombatAttribute } from "@speed-dungeon/common";
import { AnalysisRun } from "../../analysis-runs/index.ts";
import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { AnalysisPartyBuilder } from "../../analysis-runs/analysis-party-builder.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { AttributeAllocationSolver } from "../../solvers/attribute-allocation.ts";
import { BestImprovementEquipmentSolver } from "../../solvers/best-improvement.ts";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "../../solvers/equipment-score-domination-axes.ts";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "./goal-performance-checker.ts";
import { AttackDamageCombatantReport, AttackDamageRunReporter } from "./run-reporter.ts";

export function attackDamageAnalysisRun(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
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
    allocationIntensity,
    options
  );

  const report = runner.simulateRun();
  return { report, analysisSpecsHolder };
}
