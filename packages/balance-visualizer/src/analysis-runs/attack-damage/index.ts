import { AnalysisRun } from "../../analysis-runs";
import {
  AttackDamageRoomReport,
  AttackDamageRunReporter,
} from "../../analysis-runs/analysis-run-reporter";
import { BestImprovementEquipmentSolver } from "../../solvers/best-improvement";
import { CombatantClass, CombatAttribute } from "@speed-dungeon/common";
import { AttributeAllocationSolver } from "../../solvers/attribute-allocation";
import { AnalysisPartyBuilder } from "@/analysis-runs/analysis-party-builder";
import {
  AnalysisCharacterSpecification,
  CharacterWeaponSpecialty,
} from "@/analysis-subjects/analysis-character-specification";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "@/goal-performance-checkers/sampled-damage-on-target-dummy";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "@/solvers/equipment-score-domination-axes";

export function attackDamageAnalysisRun() {
  const { game, party, analysisSpecsHolder } = new AnalysisPartyBuilder().build([
    new AnalysisCharacterSpecification("character 1", {
      mainClass: CombatantClass.Warrior,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
    }),
  ]);

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
    ]),
    new AttackDamageRunReporter(party)
  );

  const report = runner.simulateRun();
  return { report, analysisSpecsHolder };
}
