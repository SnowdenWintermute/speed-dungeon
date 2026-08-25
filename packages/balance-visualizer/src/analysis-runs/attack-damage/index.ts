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

export const DEFAULT_ANALYSIS_CHARACTER_SPECS = [
  new AnalysisCharacterSpecification("character 1", {
    mainClass: CombatantClass.Warrior,
    supportClass: CombatantClass.Rogue,
    weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
  }),
  new AnalysisCharacterSpecification("character 2", {
    mainClass: CombatantClass.Rogue,
    supportClass: CombatantClass.Warrior,
    weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged,
  }),
  new AnalysisCharacterSpecification("character 3", {
    mainClass: CombatantClass.Mage,
    supportClass: CombatantClass.Rogue,
    weaponSpecialty: CharacterWeaponSpecialty.Shields,
  }),
];

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
