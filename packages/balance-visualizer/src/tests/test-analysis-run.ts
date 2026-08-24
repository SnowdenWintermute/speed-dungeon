import { AnalysisRun } from "../analysis-runs";
import {
  AttackDamageRoomReport,
  AttackDamageRunReporter,
} from "../analysis-runs/analysis-run-reporter";
import { BestImprovementEquipmentSolver } from "../solvers/best-improvement";
import { CombatantClass, CombatAttribute } from "@speed-dungeon/common";
import { AttributeAllocationSolver } from "../solvers/attribute-allocation";
import { AnalysisPartyBuilder } from "@/analysis-runs/analysis-party-builder";
import {
  AnalysisCharacterSpecification,
  CharacterWeaponSpecialty,
} from "@/analysis-subjects/analysis-character-specification";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "@/goal-performance-checkers/sampled-damage-on-target-dummy";

export function testAnalysisRun() {
  const { game, party, analysisSpecsByCombatantId } = new AnalysisPartyBuilder().build([
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
    new BestImprovementEquipmentSolver(party, analysisSpecsByCombatantId, goalPerformanceChecker, [
      () => 1,
    ]),
    new AttributeAllocationSolver(party, analysisSpecsByCombatantId, goalPerformanceChecker, [
      CombatAttribute.Strength,
    ]),
    new AttackDamageRunReporter(party)
  );

  const report = runner.simulateRun();
  // console.log(report);
}
